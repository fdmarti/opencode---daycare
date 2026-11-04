# SPEC 18 — Policies de RLS de lectura y escritura sobre `rooms` y `children`

> **Estado:** Aprobado
> **Depende de:** SPEC 15 (tablas `rooms` y `children`), SPEC 16 (listado de niños desde la base), SPEC 17 (alta real de niños desde la base)
> **Fecha:** 2026-11-04
> **Ubicación:** `specs/databases/18-rls-policies-rooms-children.md` (spec de base de datos: migración + policies; no cambia el esquema de tablas)
> **Objetivo:** Habilitar el acceso real a `public.rooms` y `public.children` desde la app: que el usuario autenticado de una guardería pueda leer las salas de su guardería, y que el staff pueda insertar niños en ellas, aislando por guardería.

## Por qué existe este spec

Las tablas `rooms` y `children` se crearon con **RLS habilitado sin policies** (deny-all), igual que `daycares` y `users`. Consecuencia medida en la base remota (2026-11-04):

- `pg_policies` devuelve **0 filas** en el schema `public`.
- `select id, name from public.rooms order by name` por Data API devuelve **0 filas** (la tabla tiene 4: Azul, Amarillo, Rojo, Verde).
- `insert` en `children` es rechazado por RLS.

Esto rompe dos pantallas ya implementadas:

- `/kids` (SPEC 16): la lista de niños sale vacía.
- `AddKidModal` (SPEC 17): el selector "SALA" no tiene opciones y el alta no puede completarse.

SPEC 17 lo dejó explícito: entregaba el código de app y delegaba los permisos a un spec de base de datos aparte. Este es ese spec.

## Alcance

**En:**

- Schema `private` con los helpers de autorización (`current_daycare_id()`, `current_user_role()`, `can_manage_children()`), `SECURITY DEFINER` para poder leer `public.users` (que también es deny-all) sin abrirle policies al mundo.
- Policies de `select` sobre `public.rooms`: el usuario autenticado ve **solo** las salas de su guardería.
- Policies de `insert`/`update`/`delete` sobre `public.rooms`: solo `staff` y `admin` de esa guardería.
- Policies de `select`/`insert`/`update`/`delete` sobre `public.children`: solo `staff` y `admin`, y solo sobre niños cuya sala pertenece a su guardería.

**Fuera del alcance (para specs futuros):**

- Policies sobre `public.users` y `public.daycares` (hoy siguen deny-all; la app no los consulta todavía).
- `parent_children` y el resto del catálogo de la base.
- Seed de niños en `public.children`.
- Esquema `private` con helpers más finos (policies por columna, por rol de padre, etc.).

## Modelo de datos (sin cambios)

No se toca el esquema de las tablas. La tenancy se deduce así:

| Tabla    | Columna de tenancy | Origen                                          |
| -------- | ------------------ | ----------------------------------------------- |
| `rooms`  | `daycare_id`       | columna propia (FK a `daycares.id`)             |
| `children` | `room_id`      | FK a `rooms.id` → `rooms.daycare_id`            |
| `users`  | `daycare_id`       | columna propia (FK a `daycares.id`)             |

`children` no lleva `daycare_id` a propósito (SPEC 15): la guardería se deduce por la sala.

## Roles

`public.user_role` = `staff` | `parent` | `admin`. El usuario autenticado es cualquiera con fila en `public.users` y `status = 'active'`.

| Operación            | `parent` | `staff` | `admin` |
| -------------------- | -------- | ------- | ------- |
| leer `rooms`         | ✅        | ✅      | ✅      |
| escribir `rooms`     | ❌        | ✅      | ✅      |
| leer `children`      | ❌        | ✅      | ✅      |
| escribir `children`  | ❌        | ✅      | ✅      |

El rol sale de `public.users.role`, no de `user_metadata` del JWT: la metadata la controla el usuario, la fila de `users` no.

## Plan de implementación

1. Crear el schema `private` (sin privilegios para `public`), granting `usage` a `authenticated`.
2. Crear los tres helpers `SECURITY DEFINER` con `search_path = public`, revocando `EXECUTE` a `public` y concediéndolo solo a `authenticated`.
3. Crear las 4 policies de `rooms` (select, insert, update, delete).
4. Crear las 4 policies de `children` (select, insert, update, delete), todas apoyadas en la pertenencia de la sala a la guardería del usuario.
5. Aplicar la migración con MCP `apply_migration` y guardar el SQL idéntico en `supabase/migrations/<version>_rls_policies_rooms_children.sql`.
6. Verificar con SQL: simular el rol `authenticated` con `request.jwt.claims` y comprobar que `select` devuelve 4 salas y que un `insert` en `children` pasa la policy; otro usuario de otra guardería no debe ver esas salas.

## Criterios de aceptación

- [ ] Existe el schema `private` con `usage` para `authenticated` y sin privilegios para `public`.
- [ ] `private.current_daycare_id()` devuelve la guardería del usuario autenticado activo y `null` si no hay fila o el usuario está `pending`.
- [ ] `private.can_manage_children()` es `true` solo para `staff` y `admin` activos.
- [ ] `select` sobre `public.rooms` con la sesión de un `staff` de "Guardería Soles" devuelve sus 4 salas.
- [ ] `select` sobre `public.rooms` con la sesión de un usuario de otra guardería devuelve 0 filas.
- [ ] `insert` en `public.children` con la sesión de un `staff` de la guardería correcta pasa la policy de `with check`.
- [ ] `insert` en `public.children` con la sesión de un `parent` es rechazado.
- [ ] `insert` en `public.children` con una sala de otra guardería es rechazado.
- [ ] `anon` no tiene ningún privilegio sobre `rooms` ni `children`.
- [ ] El archivo de migración existe en `supabase/migrations/` con el mismo SQL que se aplicó.

## Decisiones

- **Sí:** helpers en el schema `private` con `SECURITY DEFINER`. Sin ellos, una policy que consulta `public.users` se auto-bloquea: la fila de `users` es invisible para el propio usuario porque `users` también es deny-all. La alternativa sería abrirle policies a `users`, que expone el directorio de la guardería.
- **Sí:** `search_path = public` en los helpers, para que no dependan del `search_path` del cliente.
- **Sí:** `status = 'active'` como condición. Un usuario `pending` no ve ni escribe nada.
- **Sí:** el rol se lee de `public.users.role` y no de `app_metadata`. La metadata la puede editar el usuario; la fila de `users` no.
- **Sí:** `parent` no lee `children`. El catálogo de niños es de la guardería; los padres accesses a sus propios hijos vía `parent_children`, que es otro spec.
- **No:** policy de `select` sobre `rooms` para `parent`. No hace falta para esta app y agregaría superficie; se ajusta cuando exista el flujo de padres.

## Riesgos

| Riesgo                                                                              | Mitigación                                                                                                    |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Un `SECURITY DEFINER` mal acotado se convierte en una vía de escalada de privilegios. | Los helpers solo devuelven datos del propio `auth.uid()` y no aceptan argumentos.                            |
| `children` no tiene `daycare_id`: un `insert` con una sala ajena colaría datos.     | La policy de `with check` exige que la sala exista y sea de la guardería del usuario.                        |
| El aislamiento por guardería depende de que `public.users` sea la fuente de verdad.  | `users` se puebla con un trigger `SECURITY DEFINER` desde `auth.users` (SPEC 13/15) y no es editable por el cliente. |

## Qué NO está en este spec

- Policies sobre `public.users` y `public.daycares`.
- Seed de niños.
- `parent_children` y el acceso de los padres a sus hijos.
- Realtime.
- Cualquier cambio de esquema de tablas.
