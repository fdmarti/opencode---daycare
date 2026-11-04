# SPEC 15 — Tablas `rooms` y `children` en Supabase

> **Estado:** Approved
> **Depende de:** SPEC 11 (`daycares`), SPEC 12 (`users`)
> **Fecha:** 2026-11-02
> **Ubicación:** `specs/databases/15-children-and-rooms-tables.md` (spec de base de datos: migración + seed + RLS + verificación)
> **Objetivo:** Crear el enum `child_status` y las tablas `public.rooms` y `public.children` en el proyecto Supabase remoto `nbxyedmbcaotimfwdskx`, con índices, trigger de `updated_at`, RLS deny-all y grants, y sembrar 4 salas de colores en "Guardería Soles".

## Por qué existe este spec

La pantalla `/kids` y el modal de alta de niño (SPEC 03, SPEC 07) corren hoy sobre `data/kids/mock-kids.ts`. Para que el alta de niños deje de ser un `closeModal()` que descarta los datos, hace falta una tabla real donde insertar. Ese es el primer paso: esquema primero, lógica de backend después (spec de app aparte).

`children` no se puede crear sola: `room_id` es FK a `rooms` (doc §4) y `rooms` no existe en la base remota. Crear `rooms` en la misma migración es la forma más chica de dejar el esquema íntegro, y es la misma tabla que va a alimentar el selector "SALA" del modal. Por eso el spec siembra también las salas: sin filas, el selector del modal no tiene contra qué listar en el próximo spec.

El modelo de pertenencia es: **`daycares` es la institución** (Guardería Soles) **y `rooms` son sus salas**. Cada niño cuelga de una sala, y la sala cuelga de la guardería. Por eso `children` no lleva `daycare_id`: la guardería de un niño se deduce por `children → rooms → daycares`.

Estado actual verificado por MCP (2026-11-02):

- `supabase_migrations.schema_migrations` tiene 2 filas: `create_daycares` (`20261030190834`) y `create_users` (`20261030200043`).
- El schema `public` tiene 2 tablas: `daycares` y `users`. **No existen `rooms` ni `children`**.
- Enums en `public`: `user_role` (`staff,parent,admin`) y `user_status` (`pending,active`). **No existe `child_status`**.
- `public.daycares` tiene 4 filas ("Guardería Estrellitas", "Guardería Semillita", "Guardería Arcoiris", "Guardería Soles").
- Ya existe `public.set_updated_at()` (creada en SPEC 12), que este spec reutiliza en vez de duplicar.
- No existe el schema `private` ni ninguna policy de RLS en el proyecto.

## Alcance

**En:**

- Una migración, llamada `create_rooms_and_children`, aplicada vía MCP `apply_migration` contra el proyecto remoto, con este SQL:

  ```sql
  -- OpenDayCare — Tablas `rooms` y `children` (catálogo de niños de la guardería)
  --
  -- Referencia: ../../07-DB-Schema/opendaycare-database-schema.md, secciones 3 y 4.
  --
  -- Jerarquía: daycares (institución) → rooms (salas) → children (niños).
  -- `children` no lleva `daycare_id`: la guardería se deduce por la sala.
  --
  -- RLS: habilitado SIN policies (deny-all), igual que `daycares` y `users`.
  -- Las policies de multi-tenant consultan `public.users` y llegan en un spec
  -- aparte, junto con el schema `private` y sus helpers.

  create type public.child_status as enum ('active', 'archived');

  create table public.rooms (
    id         uuid primary key default gen_random_uuid(),
    daycare_id uuid not null references public.daycares(id) on delete restrict,
    name       text not null,
    created_at timestamptz not null default now(),
    constraint rooms_daycare_id_name_key unique (daycare_id, name)
  );

  comment on table public.rooms is
    'Salas de la guardería (ej. Soles, Lunas, Estrellas).';

  create index rooms_daycare_id_idx on public.rooms (daycare_id);

  create table public.children (
    id            uuid primary key default gen_random_uuid(),
    room_id       uuid not null references public.rooms(id) on delete restrict,
    full_name     text not null,
    birth_date    date not null,
    enrolled_at   date not null default current_date,
    medical_notes text,
    allergy_tags  text[] not null default '{}',
    photo_consent boolean not null default true,
    status        public.child_status not null default 'active',
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
  );

  comment on table public.children is
    'Niños inscritos en la guardería, cada uno en una sala.';

  create index children_room_id_idx on public.children (room_id);
  create index children_status_idx on public.children (status);

  create trigger children_set_updated_at
  before update on public.children
  for each row execute function public.set_updated_at();

  alter table public.rooms enable row level security;
  alter table public.children enable row level security;

  grant select, insert, update, delete on public.rooms to authenticated;
  grant select, insert, update, delete on public.children to authenticated;
  revoke all on public.rooms from anon;
  revoke all on public.children from anon;
  ```

- El mismo SQL, sin cambios, versionado en el repo como `supabase/migrations/<version>_create_rooms_and_children.sql`, donde `<version>` es el timestamp que devuelve `list_migrations` para esta migración.
- Un seed de salas, aplicado vía MCP `execute_sql` (**no** es migración: los datos no son esquema, así que no se versiona como archivo de migración), con este SQL:

  ```sql
  -- Seed — 4 salas de colores para "Guardería Soles".
  -- Es idempotente: si las salas ya están, no inserta duplicados.

  insert into public.rooms (daycare_id, name)
  select d.id, r.name
  from public.daycares d
  cross join (values ('Rojo'), ('Azul'), ('Verde'), ('Amarillo')) as r(name)
  where d.name = 'Guardería Soles'
  on conflict (daycare_id, name) do nothing;
  ```

- Verificación del esquema aplicado por MCP `execute_sql`: columnas, tipos y defaults de las dos tablas; enum `child_status`; FKs y su comportamiento `ON DELETE`; RLS activo; grants; índices; trigger de `updated_at`.
- Verificación del seed: `select name from public.rooms order by name` devuelve exactamente 4 filas (Azul, Amarillo, Rojo, Verde) y las 4 tienen `daycare_id` = el de "Guardería Soles".
- Verificación funcional de integridad dentro de una transacción que se revierte: insertar una sala de prueba y un niño, comprobar la FK, comprobar que borrar la sala con niños se rechaza y comprobar que `updated_at` cambia en un `update`.

**Fuera del alcance (para specs futuros):**

- Seed de `children`: no se siembran niños. El catálogo de niños real llega con la app.
- Policies de RLS sobre `rooms`/`children` y el schema `private` con sus helpers (`current_daycare_id`, `is_admin`, `is_staff`).
- La lógica de backend del alta: server action, lectura de la sesión, escritura del niño desde `components/kids/AddKidModal.tsx`, traducción de las etiquetas de alergia del español al inglés, y conexión de la UI con Supabase. Eso es un spec de app (`specs/app/`).
- Cambios en `data/kids/mock-rooms.ts`: el mock sigue con `["Soles", "Lunas", "Estrellas"]` hasta que el spec de app del alta cambie el selector "SALA" para leer de la base.
- Tablas restantes del modelo: `parent_children`, `invitations`, `posts`, `post_children`, `post_photos`, `reactions`, `comments`, `daily_summaries`, `devices`.
- Enums restantes: `relationship_type`, `invitation_status`, `post_type`.
- Tipos generados de `supabase-js` / `@supabase/ssr`.
- Foto o avatar del niño: el doc §4 no define columna de imagen para el niño.
- Actualizar `../07-DB-Schema/opendaycare-database-schema.md`.

## Modelo de datos

Enum nuevo:

| Enum           | Valores              | Uso                        |
| -------------- | -------------------- | -------------------------- |
| `child_status` | `active`, `archived` | Borrado lógico de un niño. |

Tabla `public.rooms`:

| Columna      | Tipo          | Restricciones                                           | Default             |
| ------------ | ------------- | ------------------------------------------------------- | ------------------- |
| `id`         | `uuid`        | primary key                                             | `gen_random_uuid()` |
| `daycare_id` | `uuid`        | not null, FK → `public.daycares(id)` ON DELETE RESTRICT | —                   |
| `name`       | `text`        | not null                                                | —                   |
| `created_at` | `timestamptz` | not null                                                | `now()`             |

Restricciones e índices:

- `UNIQUE (daycare_id, name)` (constraint `rooms_daycare_id_name_key`): dos salas de la misma guardería no pueden llamarse igual.
- Índice `rooms_daycare_id_idx` sobre `rooms (daycare_id)`: toda consulta de salas filtra por guardería.

Tabla `public.children`:

| Columna         | Tipo                  | Restricciones                                        | Default             |
| --------------- | --------------------- | ---------------------------------------------------- | ------------------- |
| `id`            | `uuid`                | primary key                                          | `gen_random_uuid()` |
| `room_id`       | `uuid`                | not null, FK → `public.rooms(id)` ON DELETE RESTRICT | —                   |
| `full_name`     | `text`                | not null                                             | —                   |
| `birth_date`    | `date`                | not null                                             | —                   |
| `enrolled_at`   | `date`                | not null                                             | `current_date`      |
| `medical_notes` | `text`                | nullable                                             | —                   |
| `allergy_tags`  | `text[]`              | not null                                             | `'{}'`              |
| `photo_consent` | `boolean`             | not null                                             | `true`              |
| `status`        | `public.child_status` | not null                                             | `'active'`          |
| `created_at`    | `timestamptz`         | not null                                             | `now()`             |
| `updated_at`    | `timestamptz`         | not null                                             | `now()`             |

Convenciones:

- Jerarquía de pertenencia: `daycares` (institución) → `rooms` (salas) → `children` (niños). `children` **no** lleva `daycare_id`: la guardería de un niño se deduce por `room_id` → `rooms.daycare_id`. Las consultas por guardería tienen que hacer join con `rooms`.
- `room_id` es `NOT NULL`: todo niño está en una sala (el modal de alta exige "SALA"), así que un niño sin sala sería un niño sin guardería atribuible. Esto aparta el doc §4, que lo marca nullable.
- `rooms.daycare_id` es `NOT NULL`: una sala pertenece a exactamente una guardería.
- Todo lo persistido va en **inglés**, salvo los nombres propios visibles al usuario: `allergy_tags` guarda `peanut`, `lactose`, `gluten` (la UI traduce a MANÍ, LACTOSA, etc.), mientras que `rooms.name` y `daycares.name` guardan la etiqueta visible en español, igual que "Guardería Soles" que ya está en `daycares`.
- `allergy_tags` es un array de Postgres por simplicidad (doc §4). No se normaliza en `allergies` + `child_allergies`.
- `enrolled_at` tiene default `current_date` porque el modal de alta no pide fecha de ingreso.
- `photo_consent` default `true` y `status` default `'active'` (doc §4).
- `updated_at` se mantiene con el trigger `children_set_updated_at` → `public.set_updated_at()`, la función que ya creó SPEC 12.
- RLS habilitado **sin** policies (deny-all), igual que `daycares` y `users`: con RLS activo y sin policies, las consultas por Data API devuelven 0 filas, sin error.
- Grants: `authenticated` con `select`, `insert`, `update` y `delete` sobre las dos tablas; `anon` sin ningún privilegio (el default privilege del schema `public` da CRUD a `anon` sobre toda tabla nueva, así que el `revoke` va explícito).
- Cadena de borrado restrictiva, en línea con `users.daycare_id` de SPEC 12: borrar una guardería con salas o con niños se rechaza, y borrar una sala con niños se rechaza. No se borra en cascada ningún niño.

Datos sembrados (seed, no esquema):

| `rooms.name` | Guardería       |
| ------------ | --------------- |
| Azul         | Guardería Soles |
| Amarillo     | Guardería Soles |
| Rojo         | Guardería Soles |
| Verde        | Guardería Soles |

- Los nombres son colores en español porque son la etiqueta visible de la sala, y van a aparecer tal cual en el selector "SALA" del modal de alta.
- El seed es idempotente (`on conflict (daycare_id, name) do nothing`): se puede volver a correr sin duplicar filas.
- Las 4 salas quedan en "Guardería Soles" porque es la guardería del usuario staff de prueba que dejó SPEC 12; es la que la app va a leer.

## Plan de implementación

1. Aplicar la migración `create_rooms_and_children` vía MCP `apply_migration` con el SQL del apartado "Alcance". Verificación: la herramienta responde sin error y `list_migrations` devuelve una tercera entrada con nombre `create_rooms_and_children`.
2. Versionar el SQL en el repo: crear `supabase/migrations/<version>_create_rooms_and_children.sql` con el SQL idéntico al aplicado, con `<version>` tomado del `list_migrations` del paso 1. Verificación: `diff` entre el archivo y el SQL aplicado no muestra diferencias.
3. Verificar el esquema por MCP `execute_sql`: `information_schema.columns` de `public.rooms` y `public.children` devuelve las columnas, tipos y defaults de "Modelo de datos"; `pg_type` devuelve `child_status` con los valores `active` y `archived`; `information_schema.referential_constraints` devuelve las 2 FKs (`rooms.daycare_id`, `children.room_id`) con su regla `ON DELETE`.
4. Verificar RLS y privileges: `pg_class.relrowsecurity` de `public.rooms` y `public.children` es `true`; `pg_policies` devuelve 0 filas para las dos tablas; `information_schema.role_table_grants` da CRUD a `authenticated` sobre las dos y ningún privilegio a `anon`.
5. Verificar índices y trigger: `pg_indexes` devuelve `rooms_daycare_id_idx`, `rooms_daycare_id_name_key`, `children_room_id_idx` y `children_status_idx`; el trigger `children_set_updated_at` existe y está habilitado sobre `public.children`.
6. Sembrar las salas por MCP `execute_sql` con el SQL del apartado "Alcance". Verificación: `select r.name, d.name from public.rooms r join public.daycares d on d.id = r.daycare_id order by r.name` devuelve 4 filas, todas con `d.name = 'Guardería Soles'`; `select count(*) from public.rooms` = 4.
7. Verificar que el seed es idempotente: correr el mismo `insert ... on conflict do nothing` otra vez. Verificación: `select count(*) from public.rooms` sigue siendo 4.
8. Verificar integridad dentro de una transacción con `rollback` (no queda data): insertar una sala de prueba en "Guardería Soles" y un niño con `birth_date`, `room_id` de esa sala y `allergy_tags = array['peanut']`; comprobar que un `insert` con `room_id` nulo falla por `NOT NULL`; comprobar que un `update` de `full_name` cambia `updated_at`; comprobar que borrar la sala con niños asignados se rechaza por `ON DELETE RESTRICT` y que el niño sigue existiendo. Verificación: la consulta devuelve las filas esperadas y, tras el `rollback`, `select count(*) from public.children` = 0 y `select count(*) from public.rooms` = 4 (solo el seed).
9. Cerrar con `get_advisors`: sin advisors nuevos de nivel error/warning sobre `public.rooms` o `public.children` (el lint INFO `rls_enabled_no_policy` es esperado, igual que en `daycares` y `users`).

## Criterios de aceptación

- [x] `list_migrations` devuelve exactamente tres entradas: `create_daycares`, `create_users` y `create_rooms_and_children`.
- [x] Existe el enum `public.child_status` con los valores exactos `active` y `archived`.
- [x] Existe la tabla `public.rooms` con exactamente las 4 columnas, tipos y defaults de "Modelo de datos".
- [x] Existe la tabla `public.children` con exactamente las 11 columnas, tipos y defaults de "Modelo de datos".
- [x] `public.rooms.daycare_id` es FK a `public.daycares(id)`, `NOT NULL`, con `ON DELETE RESTRICT`.
- [x] `public.children.room_id` es FK a `public.rooms(id)`, `NOT NULL`, con `ON DELETE RESTRICT`.
- [x] `public.children` no tiene columna `daycare_id`: la guardería se deduce por `room_id` → `rooms.daycare_id`.
- [x] `public.children.allergy_tags` es `text[]` con default `'{}'`.
- [x] `public.children.status` es `public.child_status` con default `'active'`.
- [x] `public.children.enrolled_at` es `date` `NOT NULL` con default `current_date`.
- [x] `public.rooms` tiene el constraint `UNIQUE (daycare_id, name)`.
- [x] Existen los índices `rooms_daycare_id_idx`, `children_room_id_idx` y `children_status_idx`.
- [x] El trigger `children_set_updated_at` existe sobre `public.children` y actualiza `updated_at` en cada `update`.
- [x] `pg_class.relrowsecurity` de `public.rooms` y `public.children` es `true` y `pg_policies` devuelve 0 filas para las dos tablas.
- [x] `authenticated` tiene `select`, `insert`, `update` y `delete` sobre `public.rooms` y `public.children`; `anon` no tiene ningún privilegio sobre ninguna de las dos.
- [x] `public.rooms` contiene exactamente 4 filas: Azul, Amarillo, Rojo y Verde.
- [x] Las 4 filas de `public.rooms` tienen `daycare_id` = el de "Guardería Soles".
- [x] Correr el seed por segunda vez no cambia el conteo: `public.rooms` sigue con 4 filas.
- [x] `public.children` tiene 0 filas (no hay seed de niños).
- [x] La prueba de integridad del paso 8 pasa: un niño sin `room_id` no se puede insertar, el `update` cambia `updated_at`, y borrar una sala con niños se rechaza sin borrar al niño.
- [x] Existe `supabase/migrations/<version>_create_rooms_and_children.sql` con el SQL idéntico al aplicado.
- [x] El seed **no** tiene archivo de migración en `supabase/migrations/` (los datos no son esquema).
- [x] `get_advisors` no reporta advisors nuevos de nivel error/warning sobre `public.rooms` o `public.children`.
- [x] No se modificó ningún otro archivo del repo (salvo este spec y el archivo de migración).
  > Nota: al verificar, otra sesión de opencode estaba editando `components/feed/FeedHeader.tsx` en paralelo (agrega `"use client"` a un Server Component que importa `next/headers`). Ese cambio no pertenece a este spec y no se tocó. Con ese cambio aplicado, `npm run build` falla por el import de `next/headers` en un Client Component; sobre `HEAD` limpio (verificado en un worktree aislado) el build y el lint pasan.

## Decisiones

- **Sí:** crear `rooms` en la misma migración que `children`. La FK del doc §4 lo exige y `rooms` es la tabla que alimenta el selector "SALA" del modal de alta. Se aparta de la regla de "una migración por tabla" de `AGENTS.md` porque las dos tablas son una sola unidad lógica (catálogo de niños) y `children` depende de `rooms` de forma bloqueante.
- **Sí:** la jerarquía es `daycares` (institución) → `rooms` (salas) → `children` (niños), y `children` **no** lleva `daycare_id`. La guardería de un niño se deduce por `room_id` → `rooms.daycare_id`. Se descarta la columna denormalizada para no duplicar la fuente de verdad: cada sala ya sabe a qué guardería pertenece.
- **Sí:** `children.room_id` es `NOT NULL`, apartándose del doc §4 que lo marca nullable. Todo niño está en una sala —el modal de alta exige "SALA"—, y un niño sin sala no tendría guardería atribuible, lo que rompería el filtro por tenant y el modelo de permisos.
- **Sí:** `rooms.daycare_id` es `NOT NULL`: una sala pertenece a exactamente una guardería.
- **Sí:** sembrar 4 salas de colores en "Guardería Soles". El selector "SALA" del modal de alta las va a listar, y sin filas la app no tiene nada que mostrar. Antes el spec era "sin seed"; ahora el seed de salas entra en este spec y el de niños sigue fuera.
- **Sí:** los nombres de las salas son colores en español (Rojo, Azul, Verde, Amarillo). Son la etiqueta visible que el staff ve en el selector, igual que "Guardería Soles" en `daycares.name`; el inglés se reserva para enums, tags y códigos.
- **Sí:** las 4 salas se asocian a "Guardería Soles", la guardería del usuario staff de prueba de SPEC 12, que es la que la app lee.
- **Sí:** el seed va por `execute_sql` y no es un archivo de migración: los datos no son esquema. El `insert ... on conflict (daycare_id, name) do nothing` lo hace idempotente, así que se puede volver a correr sin duplicar filas.
- **Sí:** `allergy_tags text[]` con valores en inglés, como el doc §4. La UI muestra MANÍ/LACTOSA; la traducción vive en la capa de app.
- **Sí:** `enrolled_at date not null default current_date`. El modal de alta no pide fecha de ingreso: sin default, todo alta fallaría por constraint.
- **Sí:** `UNIQUE (daycare_id, name)` en `rooms`. Sin ella el lookup por nombre del selector SALA es ambiguo y una sala podría duplicarse en cada alta.
- **Sí:** cadena de borrado `RESTRICT` en las dos FKs (`rooms.daycare_id`, `children.room_id`), igual que `users.daycare_id` de SPEC 12. No se borra en cascada ningún niño: borrarlos en silencio dejaría huérfanos sus posts, fotos y resumen diario. El borrado de una sala con niños asignados se rechaza explícitamente.
- **Sí:** RLS deny-all sin policies, igual que `daycares` y `users`. Las policies necesitan `public.users` y el schema `private`, que no existen; agregarlas acá dejaría la tabla expuesta a medio hacer.
- **Sí:** reutilizar `public.set_updated_at()` de SPEC 12 en lugar de crear una función gemela para `children`.
- **Sí:** índices en `children (room_id)` y `children (status)`. El filtro por sala es el acceso principal (listado de niños de una sala) y `status` filtra los archivados del listado activo.
- **No:** seed de `children`. El catálogo real de niños llega con la app.
- **No:** `photo_url` / avatar del niño. El doc §4 no lo define y el mockup del alta no pide foto.
- **No:** tabla `allergies` normalizada + `child_allergies`. El doc §4 ya ofrece la alternativa (`text[]`) y una tabla aparte multiplica el trabajo sin beneficio actual.
- **No:** tocar `data/kids/mock-rooms.ts`. El mock sigue con "Soles/Lunas/Estrellas" hasta que el spec de app cambie el selector a leer de la base.
- **No:** policies de RLS y schema `private` en este spec.
- **No:** la lógica de backend del alta (server action, sesión, conexión del modal con Supabase). Va en un spec de app.

## Riesgos

| Riesgo                                                                                                                                                                               | Mitigación                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children` no tiene `daycare_id`: toda consulta por guardería tiene que hacer join con `rooms`, y las policies de multi-tenant van a necesitar un subquery sobre `rooms.daycare_id`. | Es el modelo pedido. El join se apoya en el índice `children_room_id_idx` y `rooms_daycare_id_idx`; el spec de policies las escribe con esa forma.                  |
| La cadena `RESTRICT` no permite borrar una guardería con salas ni una sala con niños: no hay forma de baja ni de reasignación.                                                       | Es intencional (mismo criterio que `users.daycare_id` en SPEC 12). Si más adelante hace falta, la baja/reasignación entra como spec propio con su flujo de negocio. |
| Deny-all deja `rooms` y `children` ilegibles por Data API: el próximo spec de app no podrá leer ni escribir con un JWT de usuario.                                                   | Documentado en "Decisiones"; se resuelve al crear el schema `private` y las policies, antes de conectar la UI.                                                      |
| El default privilege del schema `public` da CRUD a `anon` sobre toda tabla nueva; un `revoke` olvidado deja las tablas públicas.                                                     | `revoke all ... from anon` explícito en la misma migración y verificación en `role_table_grants`.                                                                   |
| `allergy_tags` con valores en inglés mientras el staff escribe "Maní" en español: si el backend guarda el texto crudo, el vocabulario queda mezclado.                                | Se documenta el contrato (array en inglés) y la traducción queda a cargo del spec de app del alta, que es quien escribe el valor.                                   |
| Las 4 salas con nombres de color son datos de prueba, no un catálogo real de salas.                                                                                                  | Documentado en el spec; el spec de app del alta decide si las conserva o las reemplaza por las salas reales de la guardería.                                        |
| El mock (`data/kids/mock-rooms.ts` con "Soles/Lunas/Estrellas") y la base (Rojo/Azul/Verde/Amarillo) muestran salas distintas.                                                       | While el selector siga en el mock no hay conflicto visible; el spec de app del alta cambia el selector para leer de `public.rooms`.                                 |

## Qué NO está en este spec

- Seed de `children`.
- Policies de RLS y el schema `private` con sus helpers.
- La lógica de backend del alta de niño (server action, sesión, escritura desde `AddKidModal`).
- La traducción de etiquetas de alergia entre español e inglés.
- El cambio del selector "SALA" para leer de `public.rooms` (cambio de `data/kids/mock-rooms.ts` incluido).
- Las tablas restantes del modelo (`parent_children`, `invitations`, `posts`, `post_children`, `post_photos`, `reactions`, `comments`, `daily_summaries`, `devices`) y los enums restantes (`relationship_type`, `invitation_status`, `post_type`).
- Tipos generados de `supabase-js` / `@supabase/ssr`.
- Avatar o foto del niño.
- Flujos de baja o reasignación (no caben con la cadena `RESTRICT`).
- Cambios en `../07-DB-Schema/opendaycare-database-schema.md`.

Cada una de esas, si aterriza, va en su propio spec.
