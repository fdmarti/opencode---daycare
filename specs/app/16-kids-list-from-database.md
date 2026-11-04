# SPEC 16 — Listado de niños desde la base de datos

> **Estado:** Implementado
> **Depende de:** SPEC 03 (listado de niños), SPEC 04 (perfil de niño), SPEC 14 (`useSession`, `Skeleton`), SPEC 15 (tablas `children` y `rooms`)
> **Fecha:** 2026-11-04
> **Ubicación:** `specs/app/16-kids-list-from-database.md` (spec de app: hook + UI; no cambia el esquema)
> **Objetivo:** Reemplazar el listado mock de `/kids` por los niños reales de `public.children` agrupados por sala, con búsqueda por nombre del lado del cliente en un hook `useKids`.

## Por qué existe este spec

La pantalla `/kids` todavía muestra `data/kids/mock-kids.ts`: ocho niños inventados con ids tipo `kid-mateo`. La base ya tiene `public.children` y `public.rooms` (SPEC 15), así que el listado puede —y debe— dejar de mentir. Al mismo tiempo, `/kids/[id]` prerenderiza los ids del mock con `generateStaticParams`: con ids UUID de la base eso ya no aplica, y la vista de perfil todavía no existe como funcionalidad.

Este spec conecta la UI con los datos reales **sin** tocar el esquema: el hook lee por el cliente del navegador, como ya hace `useSession` con la sesión.

Estado real de la base remota verificado por MCP (2026-11-04):

- `public.children` y `public.rooms` existen, con RLS habilitado y **0 policies** (deny-all) → una consulta por Data API devuelve 0 filas, sin error.
- `public.children` tiene **0 filas** y `public.rooms` tiene 4 salas (Rojo, Azul, Verde, Amarillo) de "Guardería Soles".
- `parent_children` no existe → no hay forma de contar padres vinculados.
- El usuario de prueba (`fededmartinez@gmail.com`) es `staff` de "Guardería Soles" y tiene `daycare_id` en `app_metadata`.

**Consecuencia asumida por este spec:** las policies de lectura y el seed de niños viven en un spec de base de datos **pendiente y aún sin numerar**. Hasta que ese spec aplique, `/kids` se renderizará sin tarjetas (0 filas, sin error visible). Este spec entrega el código y la UI; el spec de DB entrega los datos y los permisos.

## Alcance

**En:**

- `data/kids/types.ts` (nuevo): **los únicos tipos de niños del repo**, derivados de la base — `ChildWithRoomRow` (fila de `children` con la sala embebida) y `RoomRow`. No hay un tipo de vista intermedio: la UI consume la fila de la base directamente.
- `utils/kids.ts` (nuevo): las derivaciones de la fila de la base que la UI necesita — `ageFromBirthDate(birthDate)` (años cumplidos) y `normalizeForSearch(text)` (minúsculas sin diacríticos). Sigue el patrón de `utils/session.ts`.
- `data/kids/profile-types.ts` (nuevo): las interfaces `Kid` y `KidParent` que usa `KidProfile`, movidas desde `mock-kids.ts` para que ese componente siga compilando sin el mock. Quedan aisladas y sin uso.
- `data/kids/mock-kids.ts`: **se elimina**. Ningún archivo del repo sigue importando `mockKids`.
- `hooks/useKids.ts` (nuevo): hook de Client Component que hace el fetch de `public.children`, expone el listado, el estado de carga, el texto de búsqueda y el setter, y devuelve el listado ya filtrado.
- `components/kids/KidsList.tsx` (nuevo): Client Component con el buscador, la agrupación por sala y la grilla de `KidCard`. Es el único dueño del estado de búsqueda.
- `app/(app)/kids/page.tsx`: deja de ser el dueño del listado. Sigue siendo Server Component y conserva el header ("GESTIÓN", "Niños", botón "Agregar niño"); monta `<KidsList />` y no importa datos.
- `components/kids/KidCard.tsx`: pasa a consumir `ChildWithRoomRow`. La meta es "N años" (derivada de `birth_date`, sin "padres vinculados"), el badge de alergia muestra los tags tal cual separados por coma, y desaparece el badge "VINCULAR".
- `app/(app)/kids/[id]/page.tsx`: deja de prerenderizar los ids del mock y **redirige a `/kids`**. El perfil no existe todavía como funcionalidad.
- `components/kids/KidProfile.tsx`: deja de importar los tipos del mock; importa de `data/kids/profile-types.ts`. Sigue sin usarse.
- `components/kids/KidNotFound.tsx` y `components/kids/LinkParentModal.tsx`: **no se tocan**. Quedan sin uso.

**Fuera del alcance (para specs futuros):**

- Policies de RLS de lectura sobre `children` y `rooms`, el schema `private` con sus helpers y el seed de niños: son un spec de base de datos aparte (pendiente, sin numerar). Sin él, la lista sale vacía.
- `parent_children` y el contador "N padres vinculados" de la tarjeta.
- El perfil del niño real (`/kids/[id]`): este spec solo redirige.
- El alta de niños: `AddKidModal` sigue mockeado (selector "SALA" con `data/kids/mock-rooms.ts`, "Guardar" descarta los datos).
- Traducir los tags de alergia: se muestran tal como los guardó el usuario.
- Filtrar por guardería en la app: el aislamiento por tenant es responsabilidad de las policies.
- Tipos generados de Supabase (`supabase gen types`).
- Estados de lista vacía y de error visibles en la UI (ver "Riesgos").
- `data/kids/mock-rooms.ts` y el resto del modal de alta.

## Modelo de datos

### Tipos de la base

Los tipos de niños del repo son **los de la base**, sin capa de vista intermedia: lo que la consulta devuelve es lo que la UI consume.

```ts
// data/kids/types.ts

/** Fila de `public.rooms`. */
export interface RoomRow {
  id: string;
  name: string; // "Rojo" → header "SALA ROJO"
}

/**
 * Fila de `public.children` con la sala embebida por PostgREST.
 *
 * El embedding es posible porque `children.room_id` es FK a `rooms.id`.
 */
export interface ChildWithRoomRow {
  id: string;
  full_name: string; // "Mateo Fernández"
  birth_date: string; // "2022-03-12" (YYYY-MM-DD)
  allergy_tags: string[]; // ["peanut"] — se muestran tal cual
  room_id: string;
  rooms: RoomRow | null; // null si la sala no es visible (RLS)
}
```

### Derivaciones

```ts
// utils/kids.ts

/** Años cumplidos a hoy desde "YYYY-MM-DD". */
export function ageFromBirthDate(birthDate: string): number;

/** Minúsculas sin diacríticos, para comparar nombres. */
export function normalizeForSearch(text: string): string;
```

### Tipos del perfil (sin uso, se conservan)

```ts
// data/kids/profile-types.ts
// Interfaces movidas desde `data/kids/mock-kids.ts` (que se elimina).
// Las consume `components/kids/KidProfile.tsx`, que todavía no tiene ruta real.
// Quedan aisladas: el perfil se reconstruirá con los tipos de la base cuando
// exista su spec.

export interface KidParent {
  id: string;
  name: string;
  role: "Mamá" | "Papá";
  status: "active" | "pending";
}

export interface Kid {
  id: string;
  name: string;
  age: number;
  room: string;
  birthDate: string;
  admissionDate: string;
  allergy?: string;
  allergyNotes?: string;
  parents: KidParent[];
}
```

Convenciones:

- El embedding `rooms(name)` de PostgREST devuelve `rooms` como objeto o `null`; el tipo lo refleja y la UI usa `child.rooms?.name ?? ""` como nombre de sala.
- La edad no está en la base: se deriva de `birth_date` con `ageFromBirthDate` (años cumplidos a la fecha de hoy) y se muestra como número entero: "3 años".
- Los tags de alergia se muestran **tal como los guardó el usuario**, separados por ", ": `["peanut", "lactose"]` → "peanut, lactose". Sin traducción.
- La agrupación por sala no es un tipo: se calcula en `components/kids/KidsList.tsx` agrupando el listado filtrado por el nombre de sala (`child.rooms?.name`).
- El orden de las secciones es alfabético por nombre de sala; dentro de cada sección, el orden es el que devuelve la consulta (por `full_name`).

### API del hook

```ts
// hooks/useKids.ts

export interface UseKidsState {
  /** Todos los niños de la base, sin filtrar. */
  kids: ChildWithRoomRow[];
  /** `kids` filtrados por el texto de búsqueda. */
  filteredKids: ChildWithRoomRow[];
  /** Texto actual del buscador. */
  search: string;
  /** Setter del texto del buscador. */
  setSearch: (value: string) => void;
  /** true mientras la consulta está en vuelo. */
  isLoading: boolean;
  /** Error de la consulta, si lo hubo. */
  error: Error | null;
  /** Relanza la consulta. */
  refetch: () => void;
}

export function useKids(): UseKidsState;
```

## Plan de implementación

1. Crear `data/kids/types.ts` con `RoomRow` y `ChildWithRoomRow`. Verificación: `npx tsc --noEmit` pasa y el archivo exporta los dos símbolos.
2. Crear `utils/kids.ts` con `ageFromBirthDate(birthDate)` (años cumplidos a hoy desde "YYYY-MM-DD") y `normalizeForSearch(text)` (minúsculas sin diacríticos, quitando los diacríticos con `normalize("NFD")` + `\p{Diacritic}`). Verificación: `npx tsc --noEmit` pasa y ambos helpers devuelven lo esperado para "2022-03-12" y "Sofía".
3. Crear `data/kids/profile-types.ts` con las interfaces `Kid` y `KidParent` (copiadas de `data/kids/mock-kids.ts`) y actualizar el import de `components/kids/KidProfile.tsx` a `@/data/kids/profile-types`. Verificación: `npx tsc --noEmit` pasa; `KidProfile` sigue compilando.
4. Actualizar `components/kids/KidCard.tsx` para consumir `ChildWithRoomRow`:
   - La prop pasa a `child: ChildWithRoomRow` y el nombre a `child.full_name`.
   - La meta pasa a `${ageFromBirthDate(child.birth_date)} años` (sin "padres vinculados").
   - El badge es el de alergia (`child.allergy_tags.join(", ")`) o, si no hay tags, el chevron. Se elimina el badge "VINCULAR".
   - El `href` sigue siendo `/kids/${child.id}` (ahora un UUID), de modo que el click ejercite la redirección de la ruta `[id]`.
     Verificación: `npx tsc --noEmit` pasa.
5. Crear `hooks/useKids.ts`:
   - `"use client"`; `createClient()` de `utils/supabase/client.ts`.
   - En un `useEffect`, consultar `supabase.from("children").select("id, full_name, birth_date, allergy_tags, room_id, rooms(id, name)").eq("status", "active").order("full_name")`.
   - El estado guarda las filas tal cual llegan: `kids` es `ChildWithRoomRow[]`, sin mapear a otro tipo.
   - Estado local: `kids`, `isLoading`, `error` y un contador de request para que `refetch` relance la consulta.
   - `filteredKids` se calcula con `useMemo` a partir de `kids` y `search`: compara `normalizeForSearch(child.full_name)` con `normalizeForSearch(search)` usando `includes`. El texto vacío devuelve todos los niños.
     Verificación: `npx tsc --noEmit` pasa y el hook compila en un Client Component.
6. Crear `components/kids/KidsList.tsx` (`"use client"`):
   - Usa `useKids()`; el `CustomInput variant="bare"` del buscador queda controlado con `value={search}` y `onChange={(e) => setSearch(e.target.value)}`, conservando el placeholder "Buscar niño…" y la lupa.
   - Agrupa `filteredKids` por el nombre de sala (`child.rooms?.name ?? ""`); por cada grupo renderiza el header de sección (nombre de sala en mayúsculas con el prefijo "SALA ", el contador "N niños" y el separador `#E7DAC8`) y la grilla `grid-cols-1 sm:grid-cols-2 gap-3.5` de `KidCard`.
   - Solo se renderizan las salas que tienen al menos un niño (tras el filtro de búsqueda).
   - Mientras `isLoading` es `true`, renderiza 4 tarjetas `Skeleton` con la forma de una tarjeta en vez de la grilla.
     Verificación: `npx tsc --noEmit` pasa y el componente renderiza.
7. Actualizar `app/(app)/kids/page.tsx`: queda Server Component; conserva el header y `AddKidModal`, y monta `<KidsList />` en el lugar del buscador y la grilla. Se borran el import de `mockKids` y el bloque del buscador estático. Verificación: `npx tsc --noEmit` pasa.
8. Actualizar `app/(app)/kids/[id]/page.tsx`:
   - Se elimina `generateStaticParams` (los ids ya no son estáticos).
   - La página llama `redirect("/kids")` y no renderiza nada más.
   - Se borran los imports de `mockKids`, `KidProfile` y `KidNotFound`.
     Verificación: `npx tsc --noEmit` pasa; `/kids/<uuid>` redirige a `/kids`.
9. Eliminar `data/kids/mock-kids.ts`. Verificación: `grep -rn "mock-kids\|mockKids" app components data hooks` no devuelve resultados, y `npx tsc --noEmit` sigue pasando.
10. Verificar la forma de la consulta contra la base real por MCP `execute_sql`: `select c.full_name, r.name from public.children c join public.rooms r on r.id = c.room_id` — la consulta equivalente a la del embedding debe ser válida y devolver 0 filas (la tabla está vacía). Verificación: la consulta no da error.
11. Correr `npm run lint`, `npx tsc --noEmit` y `npm run build`. Verificación: los tres pasan sin errores.
12. Verificación manual con Playwright (dev server en `http://localhost:3000`): login con `fededmartinez@gmail.com` / `abc12345`, entrar a `/kids` y comprobar que el buscador escribe, que `/kids/<uuid>` vuelve a `/kids` y que no hay errores en consola. En este punto la grilla sale vacía por el deny-all: es el comportamiento esperado hasta el spec de DB.

## Criterios de aceptación

- [x] `data/kids/mock-kids.ts` no existe y `grep -rn "mock-kids\|mockKids" app components data hooks` no devuelve resultados.
- [x] `data/kids/types.ts` exporta `RoomRow` y `ChildWithRoomRow`, y no existe ningún tipo de vista de niños en el repo (ni `KidListItem` ni equivalente).
- [x] `utils/kids.ts` exporta `ageFromBirthDate` y `normalizeForSearch`.
- [x] `data/kids/profile-types.ts` exporta `Kid` y `KidParent`, y `components/kids/KidProfile.tsx` importa de ahí (ya no del mock).
- [x] `hooks/useKids.ts` exporta `useKids` y devuelve `kids`, `filteredKids`, `search`, `setSearch`, `isLoading`, `error` y `refetch`.
- [x] `kids` y `filteredKids` son `ChildWithRoomRow[]`: el hook no transforma las filas de la base a otro tipo.
- [x] El hook consulta `public.children` con `status = 'active'`, la sala embebida (`rooms(id, name)`) y orden por `full_name`, usando el cliente de navegador de `utils/supabase/client.ts`.
- [x] La edad se deriva de `birth_date` con `ageFromBirthDate` (años cumplidos) y no se lee de ninguna columna.
- [x] El buscador filtra por `full_name` ignorando mayúsculas y acentos: con un niño "Sofía Méndez", escribir "sofia" lo deja en la grilla y escribir "xyz" lo saca.
- [x] Escribir texto en el buscador no recarga la página ni hace una nueva consulta a Supabase.
- [x] El listado se agrupa en una sección por sala: header con el nombre de la sala en mayúsculas y el prefijo "SALA ", el contador "N niños" de esa sala y el separador `#E7DAC8`.
- [x] Las salas sin niños no renderizan sección.
- [x] El contador de cada sección corresponde al número de tarjetas visibles de esa sala.
- [x] La tarjeta muestra "N años" como meta, sin "padres vinculados".
- [x] La tarjeta muestra un único badge con los tags de alergia separados por ", " y tal cual los guardó el usuario (sin traducción); sin tags, muestra el chevron.
- [x] La tarjeta no muestra el badge "VINCULAR".
- [x] `/kids/<uuid>` redirige a `/kids` y la URL final es `/kids`.
- [x] `app/(app)/kids/[id]/page.tsx` no exporta `generateStaticParams`.
- [x] `app/(app)/kids/page.tsx` no importa datos y monta `<KidsList />`; el header, el kicker "GESTIÓN" y el botón "Agregar niño" no cambian.
- [x] `data/kids/mock-rooms.ts` y `components/kids/AddKidModal.tsx` no se modifican.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores.
- [x] La consulta equivalente en la base (`children` join `rooms`) es válida y no da error.

## Decisiones

- **Sí:** un solo hook `useKids` que hace el fetch, expone el texto de búsqueda y devuelve el listado filtrado. El input de búsqueda queda dentro de `components/kids/KidsList.tsx`, que es el Client Component dueño del estado; el Server Component de la página no tiene estado.
- **Sí:** el fetch se hace en el navegador con el cliente de `utils/supabase/client.ts`, igual que `useSession`. El JWT de la sesión lleva el `app_metadata` del usuario y las policies filtran por guardería: el aislamiento es del servidor, no de la app.
- **Sí:** la búsqueda es del lado del cliente sobre el listado ya descargado, con normalización de diacríticos y minúsculas ("sofia" encuentra a "Sofía"). El hook expone `search`/`setSearch` y devuelve `filteredKids` ya filtrado.
- **Sí:** **un solo tipo de niños: el de la base.** `data/kids/types.ts` describe lo que la consulta devuelve (`ChildWithRoomRow`, `RoomRow`) y la UI consume esas filas directamente, sin un tipo de vista intermedio. La base es la fuente de verdad y duplicar sus campos en otro tipo obliga a mantener dos estructuras que se desincronizan.
- **Sí:** las derivaciones que la base no tiene (edad, normalización del nombre) viven en `utils/kids.ts` como funciones puras, no en un tipo: `ageFromBirthDate` y `normalizeForSearch`. El patrón es el de `utils/session.ts`.
- **Sí:** el perfil conserva sus tipos (`Kid`, `KidParent`) en `data/kids/profile-types.ts` para que `KidProfile` siga compilando, aunque quede sin uso y aislado del resto.
- **Sí:** la tarjeta muestra solo la edad. `parent_children` no existe, así que no hay forma honesta de mostrar "N padres vinculados" ni el badge "VINCULAR": se quitan en vez de inventar el dato.
- **Sí:** los tags de alergia se muestran tal cual los guardó el usuario, separados por coma, sin traducir a español.
- **Sí:** el listado se agrupa en una sección por sala, solo con las salas que tienen niños, ordenadas alfabéticamente; dentro de cada sala, el orden de la consulta.
- **Sí:** la meta de la tarjeta queda "N años" (sin la parte de padres).
- **Sí:** `/kids/[id]` redirige a `/kids` sin mensaje de aviso. El id ya es un UUID y no hay vista de perfil: volver al listado es la única acción posible.
- **Sí:** durante la carga se muestran 4 tarjetas `Skeleton` (componente de SPEC 14) en lugar de la grilla.
- **No:** un tipo de vista intermedio (`KidListItem` o similar) que renombre los campos de la base a camelCase. Duplicaba la forma de la fila sin agregar nada.
- **No:** seed de niños y policies de RLS en este spec. Son un spec de base de datos aparte; este asume que la base está lista y por eso el listado aparece vacío hasta entonces.
- **No:** estado de lista vacía visible ("Todavía no hay niños…"). Sin datos por el deny-all, un mensaje de vacío mentiría: la lista vacía y la guardería sin niños se verían igual.
- **No:** mensaje de error visible en la UI. El hook expone `error` para el futuro, pero la pantalla no lo muestra en este spec.
- **No:** `parent_children` ni el contador de padres.
- **No:** cambiar el modal de alta ni `data/kids/mock-rooms.ts`.
- **No:** borrar `KidProfile`, `KidNotFound` ni `LinkParentModal`. Se reconstructirán cuando exista el spec del perfil.
- **No:** tocar SPEC 03, SPEC 04 ni SPEC 15: son registro histórico.
- **No:** tipos generados de Supabase.

## Riesgos

| Riesgo                                                                                                            | Mitigación                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `children` y `rooms` siguen con RLS deny-all: la consulta devuelve 0 filas y la UI se ve vacía sin error visible. | Es explícito en "Alcance": las policies y el seed son un spec de DB pendiente. El criterio de aceptación mide la consulta y el código, no la cantidad de tarjetas. |
| Sin el spec de DB, no hay forma de verificar visualmente que la grilla pinta los niños de la base.                | El paso 9 valida la forma de la consulta por MCP, y el paso 11 valida el resto de la UI. La verificación de datos reales queda para el spec de DB.                 |
| `rooms` embebido puede venir `null` si la policy de `rooms` no deja ver la sala aunque sí el niño.                | La UI usa `child.rooms?.name ?? ""` y el hook no rompe; documentado en el tipo.                                                                                    |
| La edad depende de la fecha del dispositivo del cliente (años cumplidos).                                         | Se deriva de `birth_date` en el cliente de forma explícita, con el cálculo de años cumplidos estándar.                                                             |
| El perfil y el modal de alta quedan con datos mock o sin uso, desincronizados del listado real.                   | Documentado en "Decisiones": cada uno aterriza en su propio spec. El listado real es el único consumiendo `children`.                                              |
| No hay estado visible de "cargando" más allá de los skeletons, ni de error.                                       | Los skeletons cubren la carga. El error queda expuesto en el hook (`error`) para un spec futuro.                                                                   |

## Qué NO está en este spec

- Policies de RLS de lectura sobre `children` y `rooms`, el schema `private` y el seed de niños (spec de base de datos pendiente).
- `parent_children` y el contador "N padres vinculados".
- El perfil real del niño: `/kids/[id]` redirige y nada más.
- El alta real de niños: `AddKidModal` sigue mockeado y `data/kids/mock-rooms.ts` no se toca.
- Traducción de los tags de alergia al español.
- Estado visible de lista vacía y de error en la UI.
- Filtro por guardería en la app (lo resuelven las policies).
- Tipos generados de Supabase.
- Cambios en SPEC 03, SPEC 04 y SPEC 15.

Cada una de esas, si aterriza, va en su propio spec.
