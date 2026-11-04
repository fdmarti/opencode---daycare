# SPEC 17 — Alta real de niños desde la base de datos

> **Estado:** Approved
> **Depende de:** SPEC 07 (modal de alta mockeado), SPEC 15 (tablas `rooms` y `children`), SPEC 16 (listado de niños desde la base)
> **Fecha:** 2026-11-04
> **Ubicación:** `specs/app/17-add-kid-from-database.md` (spec de app: hook + componentes; no cambia el esquema)
> **Objetivo:** Guardar un niño real desde `AddKidModal`, insertándolo en `public.children` desde el navegador y recargando la lista de `/kids`, que sigue viniendo de un único hook y se muestra dividida por sala.

## Por qué existe este spec

`components/kids/AddKidModal.tsx` hoy es UI pura: el selector "SALA" sale de `data/kids/mock-rooms.ts` (`Soles`, `Lunas`, `Estrellas`), "Guardar" valida y cierra el modal, y el niño se pierde (SPEC 07). Mientras tanto `public.rooms` y `public.children` ya existen (SPEC 15) y `/kids` ya lee niños de la base (SPEC 16).

Este spec cierra el círculo: el modal inserta en `public.children` y la lista se recarga para mostrar al niño nuevo en el bloque de su sala. La lista **no** se parte en una consulta por sala: sigue siendo un único `select` sobre `children` que se agrupa visualmente por sala, como ya hace SPEC 16.

Estado real de la base remota verificado por MCP (2026-11-04):

- `public.rooms` tiene 4 filas (Azul, Amarillo, Rojo, Verde) de "Guardería Soles"; `public.children` tiene 0 filas.
- `pg_policies` devuelve **0 filas** en todo el schema `public`: no hay ninguna policy sobre `rooms` ni sobre `children`. El schema `private` no existe.
- Sin policies, tanto `select` como `insert` sobre esas tablas devuelven 0 filas / error por el deny-all.

**Consecuencia asumida por este spec:** las policies de lectura y escritura son un spec de base de datos **pendiente y sin numerar**. Este spec entrega el código y la UI; hasta que ese spec aplique, el selector "SALA" vendrá vacío y el `insert` será rechazado por RLS. El spec no puede verificar el alta end-to-end por su cuenta.

## Alcance

**En:**

- `hooks/useRooms.ts` (nuevo): hook de Client Component que lee `public.rooms` (`id`, `name`, ordenadas por nombre) y devuelve `rooms`, `isLoading` y `error`. El aislamiento por guardería lo resuelven las policies.
- `components/kids/KidsSection.tsx` (nuevo): Client Component padre de la pantalla `/kids`. Es el **único** dueño de `useKids()` y de `useRooms()`, y renderiza el header de la pantalla (kicker "GESTIÓN", título "Niños" y botón "Agregar niño") más la lista de niños.
- `components/kids/AddKidModal.tsx`: deja de leer `data/kids/mock-rooms.ts` y pasa a recibir las salas por prop; al enviar, hace el `insert` en `public.children` desde el navegador; mientras inserta bloquea el botón; si el insert falla, el modal sigue abierto con un mensaje de error y el formulario conserva lo tipeado; al guardar bien, cierra y avisa que recarguen la lista.
- `components/kids/KidsList.tsx`: deja de llamar a `useKids()` y pasa a ser presentacional: recibe `kids`, `search`, `setSearch` e `isLoading` por props. La agrupación visual por sala (sección "SALA X" + contador + grilla) **no cambia**.
- `app/(app)/kids/page.tsx`: sigue siendo Server Component y sigue siendo el dueño del contenedor (`max-w-220`, `px-10 pt-8.5 pb-20`). El header (kicker + título + botón) se muda a `components/kids/KidsSection.tsx` para que el botón "Agregar niño" y la lista compartan el mismo hook sin context.
- `data/kids/mock-rooms.ts`: **se elimina**. Ningún archivo del repo sigue importándolo.
- La consulta de niños sigue siendo **una sola** por carga (no una por sala): `useKids()` no cambia y `KidsList` no hace fetch.

**Fuera del alcance (para specs futuros):**

- Policies de RLS de lectura/escritura sobre `rooms` y `children`, y el schema `private` con sus helpers: son un spec de base de datos aparte (pendiente, sin numerar). Sin él, el alta no se puede completar.
- Seed de niños: `public.children` sigue vacía.
- Traducción de los tags de alergia: se guardan tal cual los escribe el staff (decisión de este spec).
- Alta o edición desde el perfil del niño, baja/archivado (`status = 'archived'`), foto del niño y `photo_consent` editable.
- `parent_children` y el contador "N padres vinculados" de la tarjeta.
- Vista de detalle del niño (`/kids/[id]`): sigue redirigiendo a `/kids` (SPEC 16).
- Optimismo en el alta (que la tarjeta aparezca sin esperar el refetch).
- Reutilizar el modal para otros formularios ("Vincular padre", "Nueva publicación", "Editar niño").
- Captura y comparación visual con Playwright contra el mockup.

## Modelo de datos

### Filas de la base

Los tipos de niños del repo son los de la base (SPEC 16). Este spec no introduce tipos de vista intermedios: reutiliza `RoomRow` y `ChildWithRoomRow` de `data/kids/types.ts`.

```ts
// data/kids/types.ts (sin cambios)
// RoomRow: { id: string; name: string }
// ChildWithRoomRow: { id, full_name, birth_date, allergy_tags, room_id, rooms }
```

### API del hook de salas

```ts
// hooks/useRooms.ts

export interface UseRoomsState {
  /** Filas de `public.rooms`, ordenadas por nombre. */
  rooms: RoomRow[];
  /** true mientras la consulta está en vuelo. */
  isLoading: boolean;
  /** Error de la consulta, si lo hubo. */
  error: Error | null;
}

export function useRooms(): UseRoomsState;
```

### Payload del insert

El `insert` escribe **solo** las columnas que el modal pide. Las demás las pone la base con sus defaults.

```ts
// payload enviado a public.children
{
  room_id: string;        // uuid de public.rooms (value del select)
  full_name: string;      // form.name.trim()
  birth_date: string;     // "YYYY-MM-DD"
  medical_notes: string | null; // form.medicalNotes.trim() || null
  allergy_tags: string[]; // texto libre partido por coma, sin vacíos
}
```

Columnas que **no** se envían y quedan en el default de la base (SPEC 15):

| Columna         | Default        | Motivo                                                      |
| --------------- | -------------- | ----------------------------------------------------------- |
| `enrolled_at`   | `current_date` | El modal no pide fecha de ingreso.                          |
| `photo_consent` | `true`         | El modal no pide consentimiento de fotos (decisión tomada). |
| `status`        | `active`       | El alta crea un niño activo; el archivado es otro flujo.    |

### Reglas de derivación

- **Tags de alergia:** el campo "ALERGIAS (ETIQUETAS)" es texto libre. Se parte por `,`, se aplica `trim()` a cada trozo y se descartan los trozos vacíos. `"Maní, Lactosa"` → `["Maní", "Lactosa"]`; `""` → `[]`. **No hay traducción**: se guarda el texto tal cual lo escribió el staff, aunque la base lo define en inglés (riesgo en "Riesgos").
- **Sala:** el `value` de cada `<option>` del select es `room.id` (uuid) y el texto visible es `room.name`. El `form.room` guardado es siempre un uuid.
- **Fecha de nacimiento:** el `input type="date"` ya entrega "YYYY-MM-DD", el mismo formato de `birth_date`. El `max` sigue siendo la fecha de hoy (`todayISO()`), calculado al abrir el modal.
- **Una sola consulta de niños:** `useKids()` consulta `children` una vez por carga, con la sala embebida y orden por `full_name`. La división por sala es **visual**: `KidsList` agrupa el array recibido por `child.rooms?.name`.

### API de los componentes

```ts
// components/kids/KidsSection.tsx
export function KidsSection(): JSX.Element;

// components/kids/AddKidModal.tsx
export interface AddKidModalProps {
  /** Salas de `public.rooms` para el selector "SALA". */
  rooms: RoomRow[];
  /** Se invoca después de un insert exitoso, para recargar el listado. */
  onSaved: () => void;
}

// components/kids/KidsList.tsx
export interface KidsListProps {
  kids: ChildWithRoomRow[];
  search: string;
  setSearch: (value: string) => void;
  isLoading: boolean;
}
```

## Plan de implementación

1. Crear `hooks/useRooms.ts` con `"use client"`:
   - `createClient()` de `utils/supabase/client.ts`.
   - En un `useEffect`, `supabase.from("rooms").select("id, name").order("name").overrideTypes<RoomRow[], { merge: false }>()` (mismo patrón de `overrideTypes` que `hooks/useKids.ts`, porque el repo no usa tipos generados de Supabase).
   - Estado local `rooms`, `isLoading`, `error`; guarda las filas tal cual llegan.
   - Verificación: `npx tsc --noEmit` pasa y el hook compila dentro de un Client Component.
2. Crear `components/kids/KidsSection.tsx` con `"use client"`:
   - Usa `useKids()` y `useRooms()`.
   - Renderiza el header movido desde `page.tsx`: kicker "GESTIÓN", `h1` "Niños" y `<AddKidModal rooms={rooms} onSaved={refetch} />`.
   - Monta `<KidsList kids={filteredKids} search={search} setSearch={setSearch} isLoading={isLoading} />`.
   - Verificación: `npx tsc --noEmit` pasa y el componente renderiza.
3. Refactorizar `components/kids/KidsList.tsx` a presentacional: sacar `useKids()` del componente y tomar los datos por props. No se toca `groupByRoom`, los headers de sección, los contadores ni la grilla.
   - Verificación: `npx tsc --noEmit` pasa y `grep -rn "useKids()" components` devuelve una sola ocurrencia (en `KidsSection.tsx`).
4. Actualizar `app/(app)/kids/page.tsx`: queda Server Component con el contenedor y monta `<KidsSection />`. Se borran el kicker, el `h1` y el import de `AddKidModal`.
   - Verificación: `npx tsc --noEmit` pasa y `/kids` renderiza igual que antes (mismo header, mismo botón).
5. En `components/kids/AddKidModal.tsx`:
   - Reemplazar el import de `mockRooms` por la prop `rooms`; las `<option>` pasan a `value={room.id}` y texto `room.name`.
   - Agregar estado `isSaving` y `error`.
   - En `handleSubmit`: primero la validación de siempre (nombre, fecha, fecha futura, sala); si hay errores, no se inserta. Si no hay, se hace el insert.
   - Verificación: `npx tsc --noEmit` pasa.
6. Implementar el insert en `components/kids/AddKidModal.tsx`:
   - `const supabase = createClient();` y `supabase.from("children").insert(payload).select("id").single()`. Se usa `.select("id")` para que el insert devuelva la fila insertada y para que un error de RLS o de constraint llegue como error del insert.
   - Payload según "Modelo de datos": `room_id`, `full_name`, `birth_date`, `medical_notes` (`null` si está vacío) y `allergy_tags` (texto partido por coma).
   - Verificación: `npx tsc --noEmit` pasa y el payload tiene exactamente esas 5 claves.
7. Estados de guardado y error en `components/kids/AddKidModal.tsx`:
   - Mientras inserta: `isSaving = true`, el botón "Guardar" queda `disabled` y muestra "Guardando…"; el formulario no se puede reenviar.
   - Si el insert falla: `isSaving = false`, el modal **sigue abierto**, se muestra un mensaje inline arriba del formulario ("No se pudo guardar el niño. Intentá de nuevo."), el error crudo va a `console.error` y el formulario conserva los valores tipeados.
   - Si el insert funciona: cerrar el modal (que resetea el formulario como ya hace `handleClose`) y llamar `onSaved()`.
   - Verificación: al enviar con la base caída o sin policies, el modal sigue abierto con el mensaje y no se pierde lo tipeado.
8. Nota de salas vacías en `components/kids/AddKidModal.tsx`: si `rooms` está vacío y ya no está cargando, el select muestra solo "Elegí una sala" y debajo un texto muted "No hay salas disponibles para esta guardería.". Con salas vacías la sala sigue siendo obligatoria, así que el guardado no puede completarse.
   - Verificación: con `rooms = []` el select no tiene opciones y el mensaje queda visible.
9. Eliminar `data/kids/mock-rooms.ts`. Verificación: `grep -rn "mock-rooms\|mockRooms" app components data hooks` no devuelve resultados y `npx tsc --noEmit` sigue pasando.
10. Verificar la forma de la consulta contra la base real por MCP `execute_sql`: `select id, name from public.rooms order by name` devuelve 4 filas y `select room_id, full_name, birth_date, medical_notes, allergy_tags from public.children` es válida (0 filas). Verificación: la consulta no da error.
11. Correr `npm run lint`, `npx tsc --noEmit`, `npm run build` y `node scripts/canonical-classes.mjs`. Verificación: los cuatro pasan sin errores ni clases no canónicas nuevas.
12. Verificación manual con Playwright (dev server en `http://localhost:3000`): login con `fededmartinez@gmail.com` / `abc12345`, entrar a `/kids`, abrir "Agregar niño" y comprobar que el modal abre, que la validación sigue bloqueando el envío vacío y que no hay errores en consola. **El alta end-to-end no se puede verificar todavía** (sin policies: el selector de salas viene vacío y el insert sería rechazado por RLS); queda para cuando aterrice el spec de DB de policies.

## Criterios de aceptación

- [ ] `hooks/useRooms.ts` exporta `useRooms` y devuelve `rooms`, `isLoading` y `error`.
- [ ] El hook consulta `public.rooms` con `select("id, name")` y `order("name")`, usando el cliente de navegador de `utils/supabase/client.ts`.
- [ ] `components/kids/KidsSection.tsx` existe, es Client Component y es el único lugar del repo donde se llama a `useKids()` (`grep -rn "useKids()" components` → 1 ocurrencia).
- [ ] `components/kids/KidsList.tsx` no importa `useKids` y recibe `kids`, `search`, `setSearch` e `isLoading` por props.
- [ ] `app/(app)/kids/page.tsx` sigue siendo un Server Component, conserva el contenedor (`max-w-220`, `px-10 pt-8.5 pb-20`) y monta `<KidsSection />`.
- [ ] El header de `/kids` (kicker "GESTIÓN", `h1` "Niños" y botón "Agregar niño") se ve igual que antes de este spec, y el botón abre el modal.
- [ ] El selector "SALA" lista las salas de `public.rooms` con `room.id` como value y `room.name` como texto, y ya no importa `data/kids/mock-rooms.ts`.
- [ ] `data/kids/mock-rooms.ts` no existe y `grep -rn "mock-rooms\|mockRooms" app components data hooks` no devuelve resultados.
- [ ] Con `rooms = []`, el select muestra solo "Elegí una sala" y el texto "No hay salas disponibles para esta guardería."; con salas, ese texto no aparece.
- [ ] "Guardar" con el formulario vacío no cierra el modal y muestra "Este campo es obligatorio" bajo nombre, fecha de nacimiento y sala.
- [ ] "Guardar" con una fecha futura no cierra el modal y muestra "La fecha no puede ser futura" bajo el campo de fecha.
- [ ] Con el formulario válido, el modal hace `insert` en `public.children` con exactamente las claves `room_id`, `full_name`, `birth_date`, `medical_notes` y `allergy_tags`.
- [ ] `full_name` y `medical_notes` se mandan con `trim()`; `medical_notes` va como `null` cuando el textarea está vacío.
- [ ] `allergy_tags` es el texto de alergias partido por `,`, con cada trozo en `trim()` y sin trozos vacíos; texto vacío produce `[]`.
- [ ] El insert no manda `enrolled_at`, `photo_consent` ni `status`: quedan en los defaults de la base.
- [ ] Mientras el insert está en vuelo, el botón "Guardar" queda deshabilitado y muestra "Guardando…", y un segundo envío no dispara otro insert.
- [ ] Si el insert falla, el modal sigue abierto, se muestra el mensaje "No se pudo guardar el niño. Intentá de nuevo." y el formulario conserva los valores tipeados.
- [ ] Si el insert tiene éxito, el modal se cierra (el formulario queda reseteado para la próxima apertura) y se llama `onSaved()`.
- [ ] Tras guardar, la lista se recarga y el niño nuevo aparece en el bloque de su sala, con su nombre, su edad y sus tags de alergia tal cual se escribieron.
- [ ] El listado sigue viniendo de **una sola** consulta a `children`: no hay una consulta por sala ni un fetch adicional en `KidsList`.
- [ ] La división visual por sala no cambia: sección con "SALA <NOMBRE>", contador "N niños", separador y grilla de `KidCard`; las salas sin niños no renderizan sección.
- [ ] El buscador sigue filtrando por `full_name` ignorando mayúsculas y acentos, y escribir en él no hace una consulta nueva a Supabase.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run build` y `node scripts/canonical-classes.mjs` pasan sin errores.
- [ ] La consulta equivalente en la base (`select id, name from public.rooms order by name`) es válida y devuelve 4 filas.

## Decisiones

- **Sí:** el insert se hace **desde el navegador** con `supabase-js`, igual que el fetch de `useKids` y `useSession`. El JWT de la sesión lleva el `app_metadata` del usuario y el aislamiento por guardería lo ensurean las policies de RLS: es el mismo patrón que ya usa el repo, sin plumbing nuevo.
- **No:** Server Action para el insert. Es la vía nativa de Next para mutaciones (la documenta `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`), pero obligaría a duplicar el acceso a datos (la lista vive en el cliente) y a sumar un roundtrip de servidor para una operación que el usuario de base ya puede hacer por Data API. Queda como opción si más adelante hay que mutar desde un Server Component.
- **No:** service role para insertar. Saltea el aislamiento por tenant: el niño se crearía sin verificar que el usuario pertenece a la guardería de la sala.
- **Sí:** el selector "SALA" lee `public.rooms` y `data/kids/mock-rooms.ts` se elimina. El mock ("Soles/Lunas/Estrellas") no existe en la base: seguir con él obligaría a mapear nombres que no van a coincidir con los uuid de `rooms`.
- **Sí:** el valor del `<option>` es `room.id` y no `room.name`. `children.room_id` es FK a `rooms.id`: el nombre es la etiqueta visible, el uuid es la clave.
- **Sí:** la lista sigue siendo **una sola** y se divide visualmente por sala. La idea de "una lista, dividida por sala" se cumple agrupando el array en `KidsList`, no haciendo una consulta por sala: menos roundtrips y un solo origen de verdad para la búsqueda.
- **Sí:** el header de `/kids` (kicker, título y botón) se muda al componente client padre `KidsSection`. Es lo que permite que el botón y la lista compartan la misma instancia de `useKids()` sin inventar un context: el botón vive en el header y necesita disparar el `refetch` de la lista.
- **Sí:** el `refetch` de `useKids` es el mecanismo de recarga. El hook ya lo expone; el modal solo lo invoca a través de `onSaved`. No se agrega `router.refresh()`: la lista se arma en el cliente, recargarla desde el servidor no la actualiza.
- **No:** actualización optimista (agregar la tarjeta al instante y reconciliar después). El refetch es una sola consulta y evita el caso de una tarjeta que hay que sacar si el insert falló.
- **Sí:** los tags de alergia se guardan **tal cual** los escribe el staff (texto partido por coma). La traducción ES→EN de SPEC 15 queda para un spec propio, con su diccionario visible para el usuario. El costo es que `allergy_tags` queda con vocabulario en español mientras el contrato de la base es inglés.
- **Sí:** el modal no pide `photo_consent`. Queda en `true` (default de la base) y no se agrega un checkbox que el mockup no tiene.
- **Sí:** el modal no manda `enrolled_at`, `photo_consent` ni `status`: se usan los defaults de la base. Mandar `status` desde la app abriría la puerta a archivar desde un alta.
- **Sí:** si el insert falla, el modal **no** se cierra: el error se muestra inline y el formulario conserva lo tipeado. Cerrar y perder el formulario sería el peor resultado posible para el usuario.
- **Sí:** el botón "Guardar" se bloquea durante el insert con el texto "Guardando…": evita el doble envío y le dice al usuario que la operación está en curso.
- **Sí:** el error crudo del insert va a `console.error` y la UI muestra un mensaje genérico en español. El texto de Supabase puede incluir detalles de esquema que no le sirven al staff.
- **Sí:** con `rooms` vacío se muestra "No hay salas disponibles para esta guardería." Es el estado real de la base hoy (deny-all) y un select vacío sin explicación parece un bug.
- **No:** un context provider de niños. Hay un solo punto de uso (la pantalla `/kids`) y un solo consumidor del refetch (el modal): un padre client que pasa la prop alcanza.
- **No:** cambiar la validación del modal (obligatorios, fecha futura, foco en el primer inválido, reset al cerrar). Es la de SPEC 07 y sigue sirviendo.
- **No:** tocar `hooks/useKids.ts`. El refetch que hace falta ya existe.
- **No:** tocar `data/kids/types.ts`. Se reutilizan `RoomRow` y `ChildWithRoomRow`.
- **No:** tocar SPEC 03, SPEC 04, SPEC 07, SPEC 15 ni SPEC 16: quedan como registro histórico.

## Riesgos

| Riesgo                                                                                                                              | Mitigación                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No hay policies de RLS: `rooms` devuelve 0 filas y el `insert` es rechazado. El alta no se puede verificar end-to-end.              | Es explícito en "Alcance": este spec entrega el código y el spec de DB de policies entrega los permisos. El criterio de aceptación mide el código, no el alta real. |
| Los tags de alergia quedan en español dentro de `allergy_tags`, que la base define en inglés.                                       | Decisión tomada y documentada; el vocabulario se normaliza en el spec de traducción, con la lista de tags a mano.                                                   |
| El refetch re-consulta toda la lista de niños: hay un instante entre cerrar el modal y ver la tarjeta nueva.                        | Es el trade-off de no usar actualización optimista; con una guardería de 4 salas el costo es una consulta.                                                          |
| El header de `/kids` pasa de Server a Client Component.                                                                             | El header es texto estático sin `Date`/`Math.random`: no hay riesgo de desajuste de hidratación.                                                                    |
| La lista se divide por sala en el cliente: si la policy de `rooms` oculta una sala, sus niños quedan en el bloque con nombre vacío. | Es el comportamiento ya documentado en SPEC 16 (`child.rooms?.name ?? ""`); no es nuevo.                                                                            |
| El select de salas no tiene un estado de "cargando": hasta que llegan, el modal muestra el placeholder.                             | Se acepta: el modal se abre a mano y el select se completa en milisegundos; con error de red queda el mensaje de "sin salas".                                       |

## Qué NO está en este spec

- Policies de RLS de lectura/escritura sobre `rooms` y `children` y el schema `private` con sus helpers (spec de base de datos pendiente).
- Seed de niños en `public.children`.
- Traducción de los tags de alergia entre español e inglés.
- Alta o edición desde el perfil del niño, archivado (`status = 'archived'`), baja y reasignación de sala.
- `photo_consent` editable y foto/avatar del niño.
- `parent_children` y el contador "N padres vinculados".
- La vista de detalle del niño (`/kids/[id]`): sigue redirigiendo a `/kids`.
- Actualización optimista de la lista y Realtime de Supabase.
- Estado visible de lista vacía o de error en el listado (solo en el modal).
- Reutilización del modal para otros formularios ("Vincular padre", "Nueva publicación", "Editar niño").
- Tipos generados de Supabase (`supabase gen types`).

Cada una de esas, si aterriza, va en su propio spec.
