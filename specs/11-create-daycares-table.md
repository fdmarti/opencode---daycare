# SPEC 11 — Tabla `daycares` en Supabase

> **Estado:** Approved
> **Depende de:** ninguno (primer spec de base de datos). Referencia de esquema: `../07-DB-Schema/opendaycare-database-schema.md` §1 `daycares`
> **Fecha:** 2026-10-30
> **Objetivo:** Crear la tabla `public.daycares` en el proyecto Supabase remoto `nbxyedmbcaotimfwdskx` con RLS habilitado y sus permisos de Data API, poblarla con 4 guarderías de prueba y reiniciar antes el historial de migraciones para que refleje el estado real de la base.

## Por qué existe este spec

Al inspeccionar el proyecto Supabase remoto (vía MCP) antes de escribir este spec, el estado real resultó ser este:

- El schema `public` está **vacío**: 0 tablas, 0 enums, no existe el schema `private`, no hay trigger en `auth.users`.
- Sin embargo `supabase_migrations.schema_migrations` tiene **2 filas**: `initial_schema` (las 13 tablas del modelo completo + índices + RLS + helpers privados + triggers) y `harden_authorization`.

O sea, el historial **afirma** que el esquema existe y la base **dice** que no. Ese desfasaje es peligroso: cualquier verificación futura que confíe en `list_migrations` dará por hecho que `public.users`, `public.rooms`, etc. ya existen, y el código que se escriba contra ellas fallará en runtime.

Este spec pone la base y el historial de acuerdo, empezando por la tabla raíz del modelo multi-tenant: `daycares`. La tabla se crea sola, con su RLS y sus grants, y **sin** policies, porque las policies de multi-tenant necesitan leer `public.users` (todavía inexistente). La tabla queda en deny-all hasta que exista `users` y se agreguen las policies. Además se siembran 4 guarderías de prueba, para que las specs siguientes tengan una guardería real contra la que insertar y verificar los FKs y las policies.

## Alcance

**En:**

- Limpieza del historial: borrar las 2 filas obsoletas de `supabase_migrations.schema_migrations` (versiones `20261030183839` y `20261030183938`). No hay triggers ni rules sobre esa tabla, el `DELETE` es seguro.
- Una migración nueva, llamada `create_daycares`, aplicada vía MCP `apply_migration` contra el proyecto remoto, con este SQL:

  ```sql
  -- OpenDayCare — Tabla `daycares` (entidad raíz del modelo multi-tenant)
  --
  -- Referencia: ../07-DB-Schema/opendaycare-database-schema.md, sección 1.
  --
  -- Convenciones del proyecto:
  --   * PK `id` uuid con default gen_random_uuid()
  --   * created_at timestamptz not null default now()
  --   * Todo lo persistido en inglés; las etiquetas visibles se traducen en la UI.
  --
  -- RLS: habilitado SIN policies. Los helpers de multi-tenant
  -- (`private.current_daycare_id()`, `private.is_admin()`) consultan
  -- `public.users`, que todavía no existe: las policies se agregan junto con
  -- la tabla `users`. Con RLS activo y sin policies la tabla es deny-all:
  -- las consultas devuelven 0 filas, sin error.

  create table public.daycares (
    id         uuid primary key default gen_random_uuid(),
    name       text not null,
    created_at timestamptz not null default now()
  );

  comment on table public.daycares is
    'Guarderías: entidad raíz del modelo multi-tenant.';

  alter table public.daycares enable row level security;

  grant select, insert, update, delete on public.daycares to authenticated;
  revoke all on public.daycares from anon;
  ```

- El mismo SQL, sin cambios, versionado en el repo como `supabase/migrations/20261030190834_create_daycares.sql` (el prefijo es la versión que devuelve `list_migrations` para esta migración). El archivo es el registro commiteado de lo aplicado; se aplica vía MCP, no con la CLI.
- Actualización de `AGENTS.md`: se documenta la regla de que todo cambio de esquema debe llegar como archivo de migración en `supabase/migrations/`, y se corrigen las afirmaciones obsoletas ("el schema está diseñado pero no implementado", "no hay carpeta `supabase/`", "`list_migrations` está vacío").

- Verificación del resultado aplicado: `list_tables` (tabla con RLS activo), `information_schema.columns` (3 columnas, tipos y defaults), `information_schema.role_table_grants` (privilegios de `authenticated` y ausencia de `anon`), `list_migrations` (una sola fila, `create_daycares`) y `get_advisors` (sin problemas nuevos).
- Seed de 4 guarderías de prueba, en un paso aparte por MCP `execute_sql`, con `id` generado (`gen_random_uuid()`) e insert idempotente por nombre:

  ```sql
  insert into public.daycares (name)
  select v.name
  from (values
    ('Guardería Soles'),
    ('Guardería Arcoiris'),
    ('Guardería Semillita'),
    ('Guardería Estrellitas')
  ) as v(name)
  where not exists (
    select 1 from public.daycares d where d.name = v.name
  );
  ```

- Verificación del seed: `public.daycares` queda con 4 filas, una por cada nombre, y `count(*)` devuelve 4.

**Fuera del alcance (para specs futuros):**

- Policies de RLS sobre `daycares` (`daycares_select`, `daycares_insert`, `daycares_update`, `daycares_delete`): dependen de `public.users` y de los helpers de `private`.
- El schema `private` y sus funciones (`current_daycare_id`, `is_staff`, `is_admin`, `is_parent_of`, `child_daycare`, `post_daycare`, `has_shared_child`, `can_view_post`).
- La tabla `public.users` y cualquier otra tabla del modelo (`rooms`, `children`, `parent_children`, `invitations`, `posts`, `post_children`, `post_photos`, `reactions`, `comments`, `daily_summaries`, `devices`).
- Los enums (`user_role`, `user_status`, `relationship_type`, `invitation_status`, `post_type`, `child_status`).
- Triggers (`set_updated_at`, `guard_user_privileges`, `on_auth_user_created`) y funciones de negocio (`public.accept_invitation`).
- Datos de ejemplo adicionales: las 4 guarderías de prueba son las únicas filas que se insertan. No hay niños, salas ni usuarios de prueba (van en el spec de onboarding).
- Actualizaciones de documentación: `../07-DB-Schema/opendaycare-database-schema.md` no se toca en este spec.
- Conectar la app a Supabase: `supabase-js` / `@supabase/ssr` no son dependencias del proyecto y la UI sigue corriendo sobre mock data.
- Generación de tipos TypeScript (`generate_typescript_types`) y cualquier cliente de base de datos.

## Modelo de datos

La tabla resultante en el schema `public`:

| Columna      | Tipo          | Restricciones | Default             |
| ------------ | ------------- | ------------- | ------------------- |
| `id`         | `uuid`        | primary key   | `gen_random_uuid()` |
| `name`       | `text`        | `not null`    | —                   |
| `created_at` | `timestamptz` | `not null`    | `now()`             |

Convenciones:

- Nombres en `snake_case` minúsculo, sin comillas, para compatibilidad con herramientas y ORMs.
- Sin `updated_at`: el doc de referencia no lo define para `daycares` (sí para las tablas que se editan, como `users`, `children` o `posts`).
- Sin índice adicional: no hay FKs hacia `daycares` todavía, ni consultas por columna que lo justifiquen.
- La tabla tiene `comment` con su propósito en el catálogo.
- `public.daycares` es la única tabla de aplicación del esquema por ahora.

Filas de prueba que se insertan:

| `name`                  | `id`                | `created_at` |
| ----------------------- | ------------------- | ------------ |
| `Guardería Soles`       | `gen_random_uuid()` | `now()`      |
| `Guardería Arcoiris`    | `gen_random_uuid()` | `now()`      |
| `Guardería Semillita`   | `gen_random_uuid()` | `now()`      |
| `Guardería Estrellitas` | `gen_random_uuid()` | `now()`      |

Convenciones del seed:

- Los `id` los genera la base; no se fijan UUIDs literales. Para specs futuros que necesiten apuntar a una guardería concreta, se la busca por `name`.
- El insert es idempotente por nombre: si el paso se repite, no duplica filas ni falla.
- No hay columna `is_test` ni marca equivalente: la tabla conserva las 3 columnas del doc de referencia. Las filas de prueba se distinguen por sus nombres y se pueden borrar por `name`.
- Los nombres son datos, no esquema: van con tilde ("Guardería") igual que los textos de la UI.

## Plan de implementación

1. Reiniciar el historial de migraciones. Ejecutar por MCP `execute_sql`:

   ```sql
   delete from supabase_migrations.schema_migrations
   where version in ('20261030183839', '20261030183938');
   ```

   Verificación: `list_migrations` devuelve la lista vacía y `information_schema.tables` para `public` sigue devolviendo 0 tablas (no se toca ningún dato del dominio).

2. Aplicar la migración `create_daycares` por MCP `apply_migration` con el SQL del apartado "Alcance" (idéntico, sin cambios). Verificación: la herramienta responde sin error y `list_migrations` devuelve una única entrada con nombre `create_daycares`.

3. Versionar la migración en el repo: crear `supabase/migrations/<version>_create_daycares.sql` con el SQL idéntico al aplicado, donde `<version>` es el `YYYYMMDDHHMMSS` que devuelve `list_migrations` para esa migración.

4. Actualizar `AGENTS.md`: documentar la regla de que todo cambio de esquema se aplica por MCP **y** se versiona como archivo en `supabase/migrations/`, y corregir las afirmaciones obsoletas sobre el estado del schema.

5. Verificar la tabla creada. Por MCP `execute_sql`:
   - `information_schema.columns` para `public.daycares` devuelve exactamente 3 filas, con los tipos y defaults del apartado "Modelo de datos".
   - `information_schema.role_table_grants` devuelve `select`, `insert`, `update` y `delete` para `authenticated`, y ninguna fila para `anon`.
   - `pg_class.relrowsecurity` para `public.daycares` es `true`, y `pg_policies` devuelve 0 filas para la tabla.

   Verificación: las tres consultas devuelven lo esperado.

6. Poblar la tabla con las 4 guarderías de prueba. Ejecutar por MCP `execute_sql` el `insert` idempotente del apartado "Alcance". Verificación: `select count(*) from public.daycares` devuelve 4, y `select name from public.daycares order by name` devuelve las 4 filas esperadas. Se repite el `insert` para confirmar la idempotencia.

7. Cerrar con los chequeos del proyecto: `get_advisors` no reporta problemas nuevos asociados a `public.daycares`, y `list_tables` muestra `daycares` con `rls_enabled: true` y 4 filas.

## Criterios de aceptación

- [x] `supabase_migrations.schema_migrations` no contiene las filas `initial_schema` ni `harden_authorization`.
- [x] `list_migrations` devuelve exactamente una migración, llamada `create_daycares`.
- [x] Existe la tabla `public.daycares` en el proyecto remoto `nbxyedmbcaotimfwdskx`.
- [x] `public.daycares` tiene exactamente 3 columnas: `id` (`uuid`, primary key, default `gen_random_uuid()`), `name` (`text`, `not null`) y `created_at` (`timestamptz`, `not null`, default `now()`).
- [x] `public.daycares` no tiene columnas `updated_at`, `slug` ni ninguna otra.
- [x] `pg_class.relrowsecurity` de `public.daycares` es `true` (RLS habilitado).
- [x] `public.daycares` no tiene ninguna policy: `pg_policies` devuelve 0 filas para la tabla.
- [x] `authenticated` tiene `select`, `insert`, `update` y `delete` sobre `public.daycares`.
- [x] `anon` no tiene ningún privilegio sobre `public.daycares`.
- [x] La tabla tiene 4 filas, con `name` exactamente igual a `Guardería Soles`, `Guardería Arcoiris`, `Guardería Semillita` y `Guardería Estrellitas`.
- [x] Cada una de las 4 filas tiene un `id` distinto y no nulo (UUID generado por la base, no un literal fijo).
- [x] Correr el `insert` del seed una segunda vez no cambia el conteo: la tabla sigue con 4 filas.
- [x] No se insertaron filas de otros dominios (ni usuarios, ni salas, ni niños).
- [x] `get_advisors` no reporta advisors nuevos de nivel error/warning referidos a `public.daycares`. (El lint INFO `rls_enabled_no_policy` es esperado: es la consecuencia directa del deny-all documentado y se cierra en el spec de `users`.)
- [x] El schema `public` contiene `daycares` como única tabla de aplicación (las de `auth`, `storage` y `realtime` no cuentan).
- [x] Existe `supabase/migrations/20261030190834_create_daycares.sql` con el SQL idéntico al aplicado, y no hay ningún otro archivo de migración en `supabase/migrations/`.
- [x] `AGENTS.md` documenta la regla de versionar cada cambio de esquema como archivo de migración en `supabase/migrations/`, y ya no afirma que el schema "está diseñado pero no implementado" ni que `list_migrations` está vacío.
- [x] No se modificó ningún otro archivo de este repo (salvo este spec).

## Decisiones

- **Sí:** una migración por tabla, empezando por `daycares`. El modelo tiene 13 tablas y varios triggers; migrar de a una mantiene cada paso verificable y evita que un fallo en una tabla deje las otras en un estado desconocido.
- **Sí:** reiniciar el historial de migraciones (borrar las 2 filas obsoletas) en vez de continuar encima. Con las filas fake, `list_migrations` seguiría reportando un esquema que no existe. Un historial de 1 entrada que dice la verdad vale más que uno de 3 entradas que miente.
- **No:** re-aplicar `initial_schema` tal cual. Reconstruir las 13 tablas de golpe reintroduce el problema que este spec viene a arreglar (un esquema grande aplicado de una vez, sin verificar tabla por tabla) y arrastra el diseño viejo de `harden_authorization` sin revisar.
- **Sí:** RLS habilitado **sin** policies en esta migración. Las policies de multi-tenant del modelo consultan `public.users` vía `private.current_daycare_id()` e `private.is_admin()`. Con RLS activo y sin policies, `authenticated` ve 0 filas y sus `insert` fallan: deny-all, que es el estado seguro. Una policy provisional que no dependa de `users` sería un placeholder que se olvida reemplazar.
- **Sí:** `revoke all on public.daycares from anon` explícito. Los default privileges del schema `public` en este proyecto otorgan `arwdDxtm` (todo el CRUD) a `anon` y a `authenticated` sobre toda tabla nueva; sin el revoke, `daycares` quedaría accesible sin autenticación.
- **Sí:** `grant select, insert, update, delete to authenticated` explícito, aunque el default ya lo otorga. Dejar el acceso declarado en la migración hace que la intención sea legible sin consultar los defaults del proyecto.
- **Sí:** `gen_random_uuid()` (UUID v4) como PK, tal como define `07-DB-Schema`. La guía de buenas prácticas de Supabase recomienda UUID v7 para evitar fragmentación de índice, pero la tabla es la raíz de un modelo multi-tenant de volumen bajo y cambiar el tipo de PK ahora obligaría a cambiarlo en las 12 tablas restantes y en el doc de referencia.
- **Sí:** `name text not null`, sin `unique`. Varias guarderías pueden llamarse igual; la unicidad, si se necesita, es una regla de negocio que va en la capa de aplicación.
- **Sí:** `comment on table` con el propósito de la tabla. El historial de migraciones no se puede leer desde el repo (no hay archivos SQL), así que el comentario es la única documentación que viaja con el objeto.
- **Sí:** sembrar 4 guarderías de prueba (`Guardería Soles`, `Guardería Arcoiris`, `Guardería Semillita`, `Guardería Estrellitas`) en el mismo spec que crea la tabla. Una tabla raíz sin filas no se puede probar de punta a punta: las specs siguientes (`users`, `rooms`, `children`) necesitan una guardería contra la que insertar y verificar los FKs y las policies.
- **Sí:** el seed va en un paso aparte con `execute_sql`, no dentro de la migración `create_daycares`. Así el DDL queda limpio y los datos se pueden volver a correr sin volver a aplicar el DDL.
- **Sí:** insert idempotente por nombre (`where not exists`). Si el paso se repite, no duplica filas ni falla por unique.
- **Sí:** `id` generado por la base (`gen_random_uuid()`), sin UUIDs literales. Fijarlos los haría parecer parte del modelo y cualquier spec futuro los tomaría como contrato.
- **No:** columna `is_test` ni marca equivalente para distinguir las filas de prueba. La tabla conserva las 3 columnas del doc de referencia; las filas se distinguen por su `name` y se pueden borrar por `name`.
- **Sí:** versionar la migración en el repo como `supabase/migrations/20261030190834_create_daycares.sql`, con el SQL idéntico al aplicado. Reversión de una decisión anterior del spec: el historial de `supabase_migrations` no es legible desde el repo y no hay stack local donde `supabase db pull` regeneraría los archivos. Un archivo commiteado por migración es el registro consultable del esquema, y la regla queda fijada en `AGENTS.md` para todas las specs siguientes. Los archivos son un **registro**, no una vía de aplicación: se siguen aplicando por MCP.
- **Sí:** actualizar `AGENTS.md` para documentar la regla de migración por cambio de esquema y corregir sus afirmaciones obsoletas sobre el estado del schema. Cierra la deuda que este spec había dejado explícita.
- **No:** tocar `../07-DB-Schema/opendaycare-database-schema.md` en este spec. Ese doc sigue siendo la fuente de verdad del modelo completo, no del estado aplicado.
- **No:** generar tipos de TypeScript ni conectar la app. La UI del proyecto sigue sobre mock data y no hay `supabase-js` en las dependencias.
- **Sí:** borrar el SQL heredado (`initial_schema`, `harden_authorization`) sin respaldo. Decisión del usuario: el modelo se va a reimplementar tabla por tabla contra `07-DB-Schema`, que es la fuente de verdad para tablas y columnas. Las policies, índices y helpers del SQL heredado quedan sin registro; los specs que los necesiten los reescriben desde cero.

## Riesgos

| Riesgo                                                                                                                             | Mitigación                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Los default privileges del schema `public` dan CRUD a `anon` sobre toda tabla nueva; un `revoke` olvidado deja `daycares` pública. | `revoke all ... from anon` explícito en la misma migración y verificación en `information_schema.role_table_grants`. |
| Borrar el historial elimina el SQL de `initial_schema` y `harden_authorization`, sin respaldo.                                     | Decisión consciente del usuario. Los specs siguientes reescriben policies e índices desde `07-DB-Schema`.            |
| La tabla queda sin policies: cualquier código que la consulte vía Data API con `authenticated` obtiene 0 filas y no error.         | Deny-all explícito y documentado; se agrega la policy en el spec de `users`, cuando exista el helper que necesita.   |
| El historial queda con una sola entrada y `supabase db pull` (cuando exista CLI) puede generar un diff confuso.                    | Se reinicia el historial a propósito; el estado real de la base es el que manda.                                     |
| `07-DB-Schema` describe un modelo que la base todavía no tiene; alguien puede leerlo como estado actual.                           | Cada spec de tabla marca en su alcance qué está implementado y qué no.                                               |
| Reejecutar el paso de seed sobre una base ya sembrada duplicaría las filas.                                                        | El `insert` filtra con `where not exists` sobre `name`: reejecutarlo no cambia el conteo.                            |
| Las 4 filas de prueba conviven con datos reales y nadie sabe cuáles son.                                                           | No hay columna `is_test`: se distinguen por sus nombres y el spec dice explícitamente que se borran por `name`.      |
| El archivo de migración del repo puede divergir del SQL realmente aplicado (se edita a mano, o se aplica DDL por MCP sin crear el archivo). | La regla de `AGENTS.md` exige aplicar **y** versionar en el mismo cambio; el archivo se escribe copiando el SQL enviado a `apply_migration`, y el prefijo de versión viene de `list_migrations`. |

## Qué NO está en este spec

- Policies de RLS sobre `daycares`.
- El schema `private` y sus funciones de autorización.
- `public.users` y el resto de las tablas del modelo.
- Los enums, los triggers y `public.accept_invitation`.
- Datos de ejemplo más allá de las 4 guarderías: no hay usuarios, salas ni niños de prueba.
- Actualizaciones a `../07-DB-Schema/opendaycare-database-schema.md`.
- Dependencias `supabase-js` / `@supabase/ssr`, tipos generados o cualquier lectura/escritura desde la app.
- Interfaz de usuario.

Cada una de esas, si aterriza, va en su propio spec.
