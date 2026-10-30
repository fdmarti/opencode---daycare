# SPEC 12 — Tabla `users` con sus enums en Supabase

> **Estado:** Approved
> **Depende de:** SPEC 11 (`daycares`)
> **Fecha:** 2026-10-30
> **Ubicación:** `specs/databases/12-users-table.md` (spec de base de datos: migración + seeder)
> **Objetivo:** Crear los enums `user_role`/`user_status` y la tabla `public.users` en el proyecto remoto `nbxyedmbcaotimfwdskx`, con trigger de alta desde `auth.users`, RLS deny-all e índice, e inyectar un usuario staff de prueba.

## Por qué existe este spec

`public.users` es la tabla que une Supabase Auth con el dominio: guarda el rol (`staff`/`parent`/`admin`), la guardería a la que pertenece la persona y sus preferencias de avisos. Es la segunda pieza del modelo multi-tenant después de `daycares` (SPEC 11), y la que desbloquea las policies de multi-tenant (`private.current_daycare_id()`, `private.is_admin()`), hoy imposibles porque la tabla no existe.

El modelo de pertenencia es 1 guardería → N usuarios, y cada perfil pertenece a **exactamente una** guardería (`daycare_id NOT NULL`). Un usuario de Auth corresponde 1:1 con una fila de `public.users` (mismo UUID).

Estado actual verificado por MCP: `auth.users` = 0 filas, `auth.identities` = 0, 0 enums, 0 triggers en `auth.users`, no existe schema `private`, `pgcrypto` instalado.

## Convención de ubicación de specs

Desde este spec, los specs se categorize por lo que tocan:

- `specs/app/NN-slug.md` — todo lo que modifica la aplicación: UI, componentes, rutas, mock data, estilos.
- `specs/databases/NN-slug.md` — todo lo que modifica la base de datos: migraciones, seeders, RLS, esquema, triggers, políticas.
- Un spec que toca ambos se parte en dos: uno por carpeta, cada uno con su propio número.
- La numeración es **global y correlativa entre las dos carpetas** (`01`–`10` en `specs/app/`, `11`–`12` en `specs/databases/`): el número identifica el spec en cualquier lugar y la carpeta dice qué toca. Para un spec nuevo se toma el número más alto que exista en cualquiera de las dos carpetas y se le suma uno.
- `specs/.spec-config.yml` queda en la raíz de `specs/` (no se replica en las subcarpetas).

Este spec es de base de datos: vive en `specs/databases/`. Los SPEC 01–10 (pantallas, componentes, mockups) son de app y los SPEC 11–12 (esquema remoto) son de base de datos.

La regla queda escrita en `AGENTS.md` para que `/spec`, `/spec-impl` y `spec-verifier` la respeten sin volver a explicarla.

## Alcance

**En:**

- Reorganización de los specs existentes según la convención de ubicación de este spec: mover con `git mv` los SPEC 01–10 a `specs/app/` y el SPEC 11 a `specs/databases/`, y dejar este spec (12) en `specs/databases/`. Los archivos conservan nombre y contenido salvo las referencias internas a paths de specs, que se actualizan al nuevo lugar.
- Actualización de `AGENTS.md`: se documenta la categorización (`specs/app/` vs `specs/databases/`), la numeración global correlativa y que `specs/.spec-config.yml` sigue en la raíz de `specs/`.
- Migración `create_users` aplicada vía MCP `apply_migration` con este SQL:

  ```sql
  -- OpenDayCare — Enums y tabla `users` (perfil de dominio sobre Supabase Auth)
  --
  -- Referencia: ../../07-DB-Schema/opendaycare-database-schema.md, sección 2.
  --
  -- RLS: habilitado SIN policies (deny-all), igual que `daycares`.
  -- Las policies de multi-tenant consultan `public.users` y llegan en un spec
  -- aparte, junto con el schema `private` y sus helpers.

  create type public.user_role as enum ('staff', 'parent', 'admin');
  create type public.user_status as enum ('pending', 'active');

  create table public.users (
    id                    uuid primary key references auth.users(id) on delete cascade,
    daycare_id            uuid not null references public.daycares(id) on delete restrict,
    role                  public.user_role not null default 'parent',
    status                public.user_status not null default 'active',
    full_name             text not null,
    avatar_url            text,
    notify_on_post        boolean not null default true,
    daily_summary_enabled boolean not null default true,
    created_at            timestamptz not null default now(),
    updated_at            timestamptz not null default now()
  );

  comment on table public.users is
    'Perfil de dominio de cada usuario de Supabase Auth, vinculado a una guardería.';

  create index users_daycare_id_idx on public.users (daycare_id);

  create or replace function public.set_updated_at()
  returns trigger
  language plpgsql
  as $$
  begin
    new.updated_at := now();
    return new;
  end;
  $$;

  create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

  alter table public.users enable row level security;

  grant select, insert, update, delete on public.users to authenticated;
  revoke all on public.users from anon;
  ```

- Trigger de alta en `auth.users` (misma migración), con `SECURITY DEFINER`:

  ```sql
  create or replace function public.handle_new_auth_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare
    v_daycare_id uuid;
    v_role       public.user_role;
    v_full_name  text;
  begin
    -- El rol y la guardería se leen de raw_app_meta_data (controlado por el
    -- servidor); full_name viene de raw_user_meta_data (controlado por el
    -- usuario, solo se usa como texto visible).
    v_daycare_id := nullif(new.raw_app_meta_data ->> 'daycare_id', '')::uuid;
    v_role := case new.raw_app_meta_data ->> 'role'
                when 'staff' then 'staff'::public.user_role
                when 'admin' then 'admin'::public.user_role
                else 'parent'::public.user_role
              end;
    v_full_name := coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), new.email);

    if v_daycare_id is null then
      return new;  -- sin guardería no se crea perfil; el signup no falla
    end if;

    insert into public.users (id, daycare_id, role, full_name)
    values (new.id, v_daycare_id, v_role, v_full_name)
    on conflict (id) do nothing;

    return new;
  end;
  $$;

  create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
  ```

- El mismo SQL, sin cambios, versionado en el repo como `supabase/migrations/<version>_create_users.sql` (el prefijo es la versión que devuelve `list_migrations`).
- Inyección del usuario de prueba por MCP `execute_sql` (**no** es migración, es seed): inserción en `auth.users` + `auth.identities` con `crypt('abc12345', gen_salt('bf'))` (bcrypt, mismo hasher de GoTrue), `raw_app_meta_data` con `daycare_id` de "Guardería Soles" y `role: staff`, y `raw_user_meta_data` con `full_name`. El trigger crea solo la fila de `public.users`.
- Verificación de que la contraseña funciona: `POST /auth/v1/token?grant_type=password` con la publishable key, email `fededmartinez@gmail.com` y password `abc12345`; la respuesta trae `access_token` cuyo `sub` coincide con `public.users.id`.

**Fuera del alcance (para specs futuros):**

- Policies de RLS sobre `users` (y sobre `daycares`), el schema `private` y sus helpers (`current_daycare_id`, `is_admin`, `is_staff`).
- El resto de enums del modelo (`relationship_type`, `invitation_status`, `post_type`, `child_status`): pertenecen a otras tablas.
- Trigger de alta por API de administración de Auth (el alta real de usuarios de la app) y flujo de signup de la app.
- `public.accept_invitation` y la tabla `invitations`.
- El resto de tablas (`rooms`, `children`, `parent_children`, `posts`, …).
- Conectar la app a Supabase (`supabase-js`/`@supabase/ssr`), tipos generados, interfaz de usuario y la pantalla de login (SPEC 05).
- Actualizar `../07-DB-Schema/opendaycare-database-schema.md`.

## Modelo de datos

Enums nuevos:

| Enum          | Valores                    |
| ------------- | -------------------------- |
| `user_role`   | `staff`, `parent`, `admin` |
| `user_status` | `pending`, `active`        |

Tabla `public.users`:

| Columna                 | Tipo                 | Restricciones                                           | Default    |
| ----------------------- | -------------------- | ------------------------------------------------------- | ---------- |
| `id`                    | `uuid`               | primary key, FK → `auth.users(id)` ON DELETE CASCADE    | —          |
| `daycare_id`            | `uuid`               | not null, FK → `public.daycares(id)` ON DELETE RESTRICT | —          |
| `role`                  | `public.user_role`   | not null                                                | `'parent'` |
| `status`                | `public.user_status` | not null                                                | `'active'` |
| `full_name`             | `text`               | not null                                                | —          |
| `avatar_url`            | `text`               | nullable                                                | —          |
| `notify_on_post`        | `boolean`            | not null                                                | `true`     |
| `daily_summary_enabled` | `boolean`            | not null                                                | `true`     |
| `created_at`            | `timestamptz`        | not null                                                | `now()`    |
| `updated_at`            | `timestamptz`        | not null                                                | `now()`    |

Convenciones:

- `daycare_id` es NOT NULL: un usuario pertenece a una y solo una guardería; una guardería tiene muchos usuarios.
- `id` es el mismo UUID que en `auth.users` (1:1). No hay columnas `email` ni `password_hash`: Supabase Auth las gestiona.
- Índice en `users (daycare_id)`: toda consulta de aplicación filtra por guardería.
- `ON DELETE RESTRICT` en el FK a `daycares`: no se puede borrar una guardería con usuarios; `ON DELETE CASCADE` en `auth.users`: borrar el usuario de Auth borra su perfil.
- `updated_at` se mantiene con el trigger `users_set_updated_at` → `public.set_updated_at()`.
- Tabla con `comment` con su propósito.

Fila de prueba que queda en `public.users`:

| `id`              | `daycare_id`    | `role`  | `status` | `full_name`         |
| ----------------- | --------------- | ------- | -------- | ------------------- |
| = `auth.users.id` | Guardería Soles | `staff` | `active` | `Federico Martínez` |

El email y la contraseña viven solo en `auth.users` / `auth.identities`.

## Plan de implementación

1. Reorganizar los specs en carpetas. Crear `specs/app/` y `specs/databases/`, mover con `git mv` los SPEC 01–10 a `specs/app/` y el SPEC 11 a `specs/databases/`, y mover este spec a `specs/databases/12-users-table.md`. Verificación: `ls specs specs/app specs/databases` muestra `specs/` con solo `app/`, `databases/` y `.spec-config.yml`; `git status` registra los movimientos como renames (`R`), no como borrados y altas.
2. Actualizar las referencias internas a paths de specs (por ejemplo `specs/01-feed-home.md` → `specs/app/01-feed-home.md`) en los specs movidos. Verificación: `grep -rn "specs/[0-9]" specs/` no devuelve rutas inexistentes.
3. Actualizar `AGENTS.md` con la regla de categorización de specs (carpetas, numeración global, ubicación de `.spec-config.yml`). Verificación: la sección "Spec-driven workflow" describe `specs/app/` y `specs/databases/`.
4. Aplicar la migración `create_users` por MCP `apply_migration` con el SQL del apartado "Alcance". Verificación: la herramienta responde sin error y `list_migrations` devuelve `create_users`.
5. Versionar la migración en el repo: crear `supabase/migrations/<version>_create_users.sql` con el SQL idéntico al aplicado, con `<version>` tomado de `list_migrations`.
6. Verificar el esquema creado por MCP `execute_sql`: `information_schema.columns` de `public.users` devuelve las 10 columnas con los tipos/defaults de "Modelo de datos"; `pg_type` devuelve los 2 enums con sus valores; `pg_class.relrowsecurity` de `public.users` es `true` y `pg_policies` devuelve 0 filas; `information_schema.role_table_grants` da CRUD a `authenticated` y nada a `anon`; existe el índice `users_daycare_id_idx`.
7. Inyectar el usuario de prueba por MCP `execute_sql`: resolver el `id` de "Guardería Soles", insertar en `auth.users` + `auth.identities` (bcrypt vía `pgcrypto`), con `raw_app_meta_data` = `{"daycare_id": "<id>", "role": "staff"}`. Verificación: `select count(*) from auth.users` = 1 y `select id, role, status, daycare_id from public.users` devuelve 1 fila con `role = staff` (creada por el trigger).
8. Verificar el login: `POST https://nbxyedmbcaotimfwdskx.supabase.co/auth/v1/token?grant_type=password` con la publishable key y `{email, password}` → 200 con `access_token`; el `sub` del JWT coincide con `public.users.id`. Verificación adicional: `select id, email, encrypted_password is not null from auth.users` devuelve la fila esperada.
9. Cerrar con `get_advisors`: sin advisors nuevos de nivel error/warning sobre `public.users` (el lint INFO `rls_enabled_no_policy` es esperado, igual que en `daycares`).

## Criterios de aceptación

- [x] `specs/` contiene solo `app/`, `databases/` y `.spec-config.yml`; no queda ningún spec suelto en la raíz.
- [x] `specs/app/` contiene los SPEC 01–10 y `specs/databases/` contiene los SPEC 11 y 12, con los nombres de archivo originales.
- [x] Los movimientos quedaron registrados como renames en git (`git status` muestra `R`), no como archivos borrados y recreados.
  > Nota del verificador: los renames ya están committeados en `20bdc40` (`git log --diff-filter=R --name-status` devuelve `R100`–`R098` para los 11 archivos movidos), así que `git status` actual ya no los lista: solo muestra el archivo nuevo de migración.
- [x] Ninguna referencia interna a un spec apunta a una ruta inexistente (`grep -rn "specs/[0-9]" specs/` no devuelve rutas viejas).
  > Nota del verificador: la única coincidencia de `grep -rn "specs/[0-9]" specs/` es la mención ilustrativa dentro de este mismo spec 12 ("`specs/01-feed-home.md` → `specs/app/01-feed-home.md`"), que documenta la transformación, no una referencia colgante. En `specs/app/` y `specs/databases/` no queda ninguna referencia a rutas viejas.
- [x] `AGENTS.md` documenta la categorización `specs/app/` vs `specs/databases/`, la numeración global correlativa y que `.spec-config.yml` queda en la raíz de `specs/`.
- [x] `list_migrations` devuelve exactamente dos entradas: `create_daycares` y `create_users`.
- [x] Existen los enums `public.user_role` (`staff`,`parent`,`admin`) y `public.user_status` (`pending`,`active`) con esos valores exactos.
- [x] Existe la tabla `public.users` con exactamente las 10 columnas y defaults del apartado "Modelo de datos".
- [x] `public.users.id` es FK a `auth.users(id)` con `ON DELETE CASCADE`; `public.users.daycare_id` es FK a `public.daycares(id)`, `NOT NULL`, con `ON DELETE RESTRICT`.
- [x] `pg_class.relrowsecurity` de `public.users` es `true` y `pg_policies` devuelve 0 filas para la tabla.
- [x] `authenticated` tiene `select`, `insert`, `update` y `delete` sobre `public.users`; `anon` no tiene ningún privilegio.
- [x] Existe el índice `users_daycare_id_idx` sobre `public.users (daycare_id)`.
- [x] El trigger `users_set_updated_at` actualiza `updated_at` en cada `update`.
- [x] El trigger `on_auth_user_created` existe sobre `auth.users` y crea la fila en `public.users` con `daycare_id`, `role` y `full_name` tomados de la metadata.
- [x] Un `insert` en `auth.users` sin `daycare_id` en `raw_app_meta_data` no falla y no crea fila en `public.users`.
- [x] `auth.users` contiene 1 fila: `fededmartinez@gmail.com`, con `encrypted_password` no nula (bcrypt) y `email_confirmed_at` no nulo.
- [x] `auth.identities` contiene la identidad `email` del mismo `user_id`.
- [x] `public.users` contiene exactamente 1 fila: `role = staff`, `status = active`, `daycare_id` = "Guardería Soles", `full_name` = `Federico Martínez`, y su `id` es igual al `auth.users.id`.
- [x] `POST /auth/v1/token?grant_type=password` con `fededmartinez@gmail.com` / `abc12345` devuelve 200 con `access_token`, y el `sub` del token coincide con `public.users.id`.
- [x] Existe `supabase/migrations/<version>_create_users.sql` con el SQL idéntico al aplicado.
- [x] `get_advisors` no reporta advisors nuevos de nivel error/warning sobre `public.users`.
  > Nota del verificador: no hay advisors de nivel **error**. Sobre la tabla `public.users` el único hallazgo es el lint **INFO** `rls_enabled_no_policy`, esperado por el deny-all de este spec (igual que `daycares`). Quedan tres **WARN** a nivel proyecto, todos **decididos explícitamente en las "Decisiones" de este spec** y ninguno sobre la tabla: `anon_security_definer_function_executable` y `authenticated_security_definer_function_executable` sobre `public.handle_new_auth_user()` (decisión: **no** revocar execute) y `function_search_path_mutable` sobre `public.set_updated_at()` (decisión del usuario: dejarlo tal cual). También persiste el WARN de proyecto `auth_leaked_password_protection` (configuración de Auth, ajena a este spec).
- [x] No se modificó ningún otro archivo del repo (salvo este spec).
  > Nota del verificador: el working tree solo tiene el archivo nuevo `supabase/migrations/20261030200043_create_users.sql` (exigido por otro criterio de este mismo spec) y este spec. En el commit `20bdc40` los demás cambios son los expressly previstos en el "Alcance": `AGENTS.md` (regla de categorización) y `.opencode/agents/spec-verifier.md` (resolver specs en las dos carpetas).

## Decisiones

- **Sí:** categorizar los specs por lo que tocan (`specs/app/` vs `specs/databases/`). Un spec de base de datos termina tocando migraciones, seeders y RLS: mezclado con los specs de UI, el repo se vuelve difícil de recorrer y no queda claro qué parte del trabajo es esquema y qué parte es pantalla.
- **Sí:** numeración global correlativa entre las dos carpetas, no reiniciada por carpeta. El número identifica el spec (`SPEC 11`, `SPEC 12`) en cualquier lugar, incluidos los headers `**Depende de:**` y las ramas `spec-NN-slug`. Reiniciar el contador por carpeta haría ambiguo un "SPEC 03".
- **Sí:** `specs/.spec-config.yml` queda en la raíz de `specs/`, no replicado en cada subcarpeta. Es una sola configuración para todo el flujo de specs.
- **Sí:** reorganizar los specs 01–11 ahora y no de forma gradual. Un árbol a medio migrar (mitad en la raíz, mitad en carpetas) es peor que los dos estados extremos: el lector no sabe cuál es el correcto.
- **Sí:** mover con `git mv`, preservando el nombre y el contenido de cada archivo. Solo se corrigen las referencias internas a paths de specs; el cuerpo de los specs es registro histórico.
- **Sí:** documentar la regla en `AGENTS.md` y no solo en este spec. `AGENTS.md` se carga en cada sesión del repo: es el lugar donde `/spec`, `/spec-impl` y `spec-verifier` la van a leer.
- **No:** editar las skills `spec` y `spec-impl` de `.agents/skills/` (vienen de `klerith/fernando-skills`, con hash en `skills-lock.json`). Editarlas localmente rompería el hash contra el repo compartido. La regla en `AGENTS.md` alcanza a las skills en el contexto del proyecto.
- **Sí:** el comentario de referencia al doc de esquema dentro del SQL usa `../../07-DB-Schema/...`, que es la ruta correcta desde `supabase/migrations/`. En la prosa del spec la ruta es relativa a la raíz del repo (`../07-DB-Schema/...`), como en `AGENTS.md`.
- **Sí:** solo los enums que la tabla necesita (`user_role`, `user_status`). Los otros cuatro enums pertenecen a tablas que no se crean en este spec.
- **Sí:** RLS habilitado **sin** policies (deny-all), igual que `daycares` en SPEC 11. Las policies de multi-tenant necesitan el schema `private` y sus helpers, que leen `public.users`: ese es un spec aparte. Consecuencia explícita: leer `public.users` vía Data API con un JWT de usuario devuelve 0 filas; la verificación del perfil se hace por SQL.
- **Sí:** el trigger lee `role` y `daycare_id` de `raw_app_meta_data`, no de `raw_user_meta_data`. `raw_user_meta_data` lo controla el cliente: un padre podría pedir `role = admin` en el signup. `app_metadata` lo fija el servidor.
- **Sí:** `role` se castea con un `case` que cae en `parent` para cualquier valor desconocido, en vez de castear y arriesgar una excepción que bloquearía el signup.
- **Sí:** si falta `daycare_id`, el trigger no inserta perfil y **no** lanza error: el signup sigue siendo válido y el alta del perfil queda para un flujo posterior (invitación).
- **Sí:** `daycare_id NOT NULL` (1 guardería por usuario), coherente con "1 daycare → N usuarios".
- **Sí:** `ON DELETE RESTRICT` hacia `daycares` y `ON DELETE CASCADE` desde `auth.users`. Borrar una guardería con usuarios sería pérdida silenciosa de datos; borrar el usuario de Auth sí debe llevarse su perfil.
- **Sí:** el trigger `set_updated_at` se incluye en esta migración. `updated_at` sin mantenimiento sería una columna que miente.
- **Sí:** el usuario de prueba se inyecta por SQL con `crypt('abc12345', gen_salt('bf'))` (bcrypt, el hasher de GoTrue) en lugar de usar la service_role key: no hace falta compartir un secreto, y de paso ejercita el trigger `on_auth_user_created` con la metadata real.
- **No:** la service_role key. El MCP no expone creación de usuarios de Auth y el secreto no está en el repo.
- **No:** `revoke execute on function public.handle_new_auth_user() from public`. La función solo se dispara con inserts en `auth.users`, sobre los que `anon` no tiene privilegio; dejarla ejecutable no expone nada y evita romper el alta de Auth.
- **Sí:** el seed del usuario de prueba va por `execute_sql` aparte, no dentro de la migración. Los datos no son esquema.
- **No:** crear `private` ni las policies de `users`/`daycares` en este spec.
- **No:** conectar la app (ni `supabase-js`, ni tipos, ni la pantalla de login). La UI sigue sobre mock data.

## Riesgos

| Riesgo                                                                                                                                            | Mitigación                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Deny-all deja `public.users` ilegible por API, lo que puede confundir a quien verifier contra `authenticated`.                                    | Documentado en el spec; la lectura de perfil por SQL hasta que existan las policies.                                                                                                                                                 |
| El trigger lee `daycare_id` de `app_metadata`, que el flujo de signup real todavía no escribe → ningún signup actual crearía perfil.              | El signup en la app no está implementado; cuando exista, el servidor debe setear `app_metadata`. El trigger no falla en ese caso, solo no crea perfil.                                                                               |
| `crypt()` no coincide con el hasher de GoTrue si Supabase cambiara de bcrypt a argon2 → la contraseña de prueba no funcionaría.                   | Verificación explícita en el paso 5 (login real contra la API).                                                                                                                                                                      |
| El default privilege del schema `public` da CRUD a `anon` sobre toda tabla nueva; un `revoke` olvidado deja la tabla pública.                     | `revoke all ... from anon` explícito en la misma migración y verificación en `role_table_grants`.                                                                                                                                    |
| Inyectar el usuario por SQL inserta en `auth.users` sin pasar por GoTrue; algún campo interno (confirmación, identidad) puede quedar desalineado. | Se replican los campos que GoTrue exige (`instance_id`, `aud`, `role`, `encrypted_password`, `email_confirmed_at`, provider en `raw_app_meta_data`) y la fila de `auth.identities`; el login se verifica contra la API en el paso 5. |

## Qué NO está en este spec

- Mover o reescribir las skills `spec`/`spec-impl` de `.agents/skills/` (son compartidas y con hash).
- Policies de RLS y el schema `private` con sus helpers.
- El resto de enums (`relationship_type`, `invitation_status`, `post_type`, `child_status`).
- `invitations`, `public.accept_invitation` y el flujo de onboarding.
- El resto de tablas del modelo.
- Alta de usuarios desde la app y flujo de signup.
- `supabase-js`/`@supabase/ssr`, tipos generados, login de la UI.
- Cambios en `../07-DB-Schema/opendaycare-database-schema.md`.

Cada una de esas, si aterriza, va en su propio spec.
