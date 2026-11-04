# SPEC 19 — Estado global con Zustand y formulario de alta con React Hook Form

> **Estado:** Approved
> **Depende de:** SPEC 16 (listado de niños desde la base), SPEC 17 (alta real de niños desde la base), SPEC 18 (policies de RLS sobre `rooms` y `children`)
> **Fecha:** 2026-11-04
> **Ubicación:** `specs/app/19-zustand-and-react-hook-form.md` (spec de app: dependencias npm + store + formulario; no cambia el esquema)
> **Objetivo:** Mover el estado de niños a un store global de Zustand con su propio dispatcher de fetch, y reescribir el formulario de alta con React Hook Form validado por Zod.

## Por qué existe este spec

Hoy el estado de la pantalla `/kids` está repartido en dos piezas que no se hablan:

- `hooks/useKids.ts` es el dueño de los niños, del texto de búsqueda y del refetch. Es un hook de estado local: cada componente que lo consume tendría su propia instancia.
- `components/kids/AddKidModal.tsx` mantiene su propio estado de formulario (`useState` con 5 campos, `errors`, `fieldRefs`) y su propia validación a mano, mientras el hook mantiene su propio `isLoading`. Dos fuentes de estado para la misma pantalla.

Zustand resuelve la primera: un store por feature con la lista, la búsqueda, el estado de carga y las acciones (`fetchKids`, `addKid`) en un único lugar, al que acceden el header, la lista y el modal. React Hook Form + Zod resuelven la segunda: el formulario deja de duplicar el estado a mano y su validación pasa a ser un schema declarativo.

Estado real de la base remota verificado por MCP (2026-11-04):

- La migración `20261104172644_rls_policies_rooms_children` **ya está aplicada**: `pg_policies` devuelve 8 filas en `public`.
- `public.children` tiene **2 filas** y `public.rooms` tiene 4.
- Consecuencia: a diferencia de SPEC 16 y 17, este spec **sí** puede verificar el listado y el alta end-to-end.

## Alcance

**En:**

- `package.json` y `package-lock.json`: se instalan `zustand`, `react-hook-form`, `@hookform/resolvers` y `zod`.
- `stores/kids-store.ts` (nuevo): store Zustand con `kids`, `search`, `isLoading`, `error` y las acciones `setSearch`, `fetchKids` y `addKid`. Es el "dispatcher": es dueño del fetch de niños y del insert del alta.
- `hooks/useKids.ts`: **se elimina**. Ningún archivo del repo lo importa.
- `components/kids/KidsSection.tsx`: deja de usar `useKids`; dispara `fetchKids()` en un `useEffect` al montar y monta `<AddKidModal rooms={rooms} />` sin la prop `onSaved`.
- `components/kids/KidsList.tsx`: lee el store directamente (`kids`, `search`, `setSearch`, `isLoading`) y filtra con `useMemo`. Deja de recibir props.
- `components/kids/AddKidModal.tsx`: pasa a `useForm` + `zodResolver`; los inputs quedan no controlados con `register`; el estado de guardado pasa a `formState.isSubmitting`; el insert se delega en `addKid` del store.
- `schemas/add-kid-schema.ts` (nuevo): schema Zod del formulario de alta y el tipo `AddKidFormValues` derivado con `z.infer`.
- `utils/kids.ts`: suma `parseAllergyTags`, `filterKidsByName` y `todayISO` (esta última sale del modal).

**Fuera del alcance (para specs futuros):**

- Zustand para salas, sesión o feed: `useRooms` y `useSession` siguen siendo hooks.
- Persistencia con el middleware `persist` (localStorage): la base es la fuente de verdad y el store no cachea datos entre sesiones.
- Un store por request ni un provider de contexto: la documentación de Zustand para Next.js desaconseja ambos; el store es cliente y lo consume solo Client Components.
- Reutilizar React Hook Form en otros formularios (login, register, "Vincular padre", "Nueva publicación", perfil del niño).
- Validar el payload del insert en el servidor con Zod: el store inserta la fila tal cual, igual que hoy.
- Validar el `room_id` como uuid en el schema: el id viene de `public.rooms` y su formato es responsabilidad de la base.
- Cambios visuales: el modal y el listado se ven igual; solo cambia **cuándo** aparece el error de validación.
- Cambios de esquema, migraciones o seeds.
- Tests automatizados: el repo no tiene runner de tests.
- `parent_children`, el perfil del niño (`/kids/[id]`), la traducción de los tags de alergia y el resto del mockup: son specs propios.

## Modelo de datos

### Store de niños

```ts
// stores/kids-store.ts

/** Payload del insert en `public.children` (misma forma que SPEC 17). */
export interface AddKidPayload {
  room_id: string;
  full_name: string;
  birth_date: string; // "YYYY-MM-DD"
  medical_notes: string | null;
  allergy_tags: string[];
}

export interface KidsStoreState {
  /** Todos los niños de la base, sin filtrar. */
  kids: ChildWithRoomRow[];
  /** Texto actual del buscador. */
  search: string;
  /** true mientras la consulta está en vuelo. */
  isLoading: boolean;
  /** Error de la consulta, si lo hubo. */
  error: Error | null;
  /** Setter del texto del buscador. */
  setSearch: (value: string) => void;
  /** Consulta `public.children` y reemplaza la lista. */
  fetchKids: () => Promise<void>;
  /** Inserta un niño en `public.children` y recarga la lista. */
  addKid: (payload: AddKidPayload) => Promise<void>;
}

export const useKidsStore: UseBoundStore<StoreApi<KidsStoreState>>;
```

Reglas del store:

- `fetchKids` hace **exactamente** la consulta de `hooks/useKids.ts`: `supabase.from("children").select("id, full_name, birth_date, allergy_tags, room_id, rooms(id, name)").eq("status", "active").order("full_name")` con el cliente de navegador de `utils/supabase/client.ts` y `overrideTypes<ChildWithRoomRow[], { merge: false }>()`. Sin cambios en la consulta.
- `fetchKids` pone `isLoading = true` mientras vuela, y en error deja `kids = []`, `error` con el error de Supabase e `isLoading = false`.
- `addKid` inserta con `.select("id").single()` (para que los errores de RLS o de constraint lleguen como error del insert). Si el insert falla, **rechaza** la promesa con el error de Supabase y no toca `error` (ese campo es el error de la consulta). Si tiene éxito, llama a `fetchKids()` para recargar la lista.
- El store **no** guarda estado derivado (`filteredKids`): el filtro se calcula en el componente con `useMemo`, para no devolver un array nuevo en cada render.
- El store no filtra por guardería: eso lo.ensurean las policies de RLS.

### Schema del formulario

```ts
// schemas/add-kid-schema.ts

export const REQUIRED_MESSAGE = "Este campo es obligatorio";
export const FUTURE_DATE_MESSAGE = "La fecha no puede ser futura";

export const addKidSchema = z.object({
  name: z.string().trim().min(1, REQUIRED_MESSAGE),
  birthDate: z
    .string()
    .min(1, REQUIRED_MESSAGE)
    .refine((value) => value <= todayISO(), FUTURE_DATE_MESSAGE),
  room: z.string().min(1, REQUIRED_MESSAGE),
  allergies: z.string(),
  medicalNotes: z.string().trim(),
});

export type AddKidFormValues = z.infer<typeof addKidSchema>;
```

Reglas del schema:

- **Orden de las reglas:** `trim()` antes de `min(1)`: un nombre de solo espacios es "Este campo es obligatorio", no un nombre de una letra.
- **El `trim()` de Zod transforma el valor de salida**: `values.name` y `values.medicalNotes` ya vienen recortados. El modal no vuelve a recortar.
- **Fecha futura:** la comparación contra `todayISO()` se evalúa dentro del `refine`, o sea en el momento de validar en el navegador. El `max` del `<input type="date">` sigue siendo una ayuda visual, no la garantía.
- **Formato de fecha:** no se usa `z.iso.date()`. El `<input type="date">` ya entrega "YYYY-MM-DD" o cadena vacía; validar el formato agregaría un mensaje de error que el usuario nunca puede ver.
- **Sala:** se valida que no esté vacía, no que sea un uuid. El id viene de `public.rooms`.
- **Alergias y notas:** campos libres, sin validación; solo se recortan las notas.

### Derivaciones

```ts
// utils/kids.ts

/** Divide el texto libre de alergias en tags, sin vacíos. */
export function parseAllergyTags(value: string): string[];

/** Filtra niños por nombre, ignorando mayúsculas y acentos. */
export function filterKidsByName(
  kids: ChildWithRoomRow[],
  search: string,
): ChildWithRoomRow[];

/** Hoy en "YYYY-MM-DD" en la zona horaria local. */
export function todayISO(): string;
```

`filterKidsByName` reemplaza el `useMemo` que estaba dentro de `hooks/useKids.ts`: con `search` vacío devuelve la lista completa; si no, compara `normalizeForSearch(child.full_name)` con `normalizeForSearch(search.trim())` usando `includes`.

### API de los componentes

```ts
// components/kids/KidsSection.tsx
export function KidsSection(): JSX.Element;

// components/kids/KidsList.tsx
export function KidsList(): JSX.Element; // sin props: lee todo del store

// components/kids/AddKidModal.tsx
export interface AddKidModalProps {
  /** Salas de `public.rooms` para el selector "SALA". */
  rooms: RoomRow[];
}
```

`AddKidModal` pierde la prop `onSaved`: la recarga la hace `addKid` dentro del store.

### Configuración del formulario

```ts
const {
  register,
  handleSubmit,
  reset,
  setFocus,
  formState: { errors, isSubmitting },
} = useForm<AddKidFormValues>({
  resolver: zodResolver(addKidSchema),
  mode: "onBlur",
  defaultValues: {
    name: "",
    birthDate: "",
    room: "",
    allergies: "",
    medicalNotes: "",
  },
});
```

- `mode: "onBlur"`: cada campo muestra su error al salir del campo, sin esperar a "Guardar". Al enviar, RHF valida igual y muestra todos los errores pendientes.
- `reValidateMode` queda en su valor por defecto (`"onChange"`): una vez que un campo falló, se revalida mientras se escribe.
- El foco va al primer inválido al enviar: `handleSubmit(onSubmit, onInvalid)` y, en `onInvalid`, `setFocus` sobre el primer campo con error en el orden `["name", "birthDate", "room"]`.
- `reset()` en el cierre del modal: deja los valores y los errores como estaban antes de abrir.

## Plan de implementación

1. Instalar las dependencias: `npm install zustand react-hook-form @hookform/resolvers zod`.
   - Verificación: `package.json` lista las cuatro como `dependencies` y `package-lock.json` queda actualizado. Versiones resueltas al 2026-11-04: `zustand@5.0.16`, `react-hook-form@7.91.0`, `@hookform/resolvers@7.0.2`, `zod@4.6.7`.
2. Crear `schemas/add-kid-schema.ts` con `addKidSchema`, `REQUIRED_MESSAGE`, `FUTURE_DATE_MESSAGE` y el tipo `AddKidFormValues`.
   - Verificación: `npx tsc --noEmit` pasa y `addKidSchema.parse({ name: "  ", ... })` falla con "Este campo es obligatorio" y una fecha futura falla con "La fecha no puede ser futura".
3. Ampliar `utils/kids.ts` con `parseAllergyTags`, `filterKidsByName` y `todayISO` (esta última movida desde `components/kids/AddKidModal.tsx`).
   - Verificación: `npx tsc --noEmit` pasa y `filterKidsByName` con "sofia" deja a "Sofía Méndez".
4. Crear `stores/kids-store.ts` con `create<KidsStoreState>()(...)`: estado, `setSearch`, `fetchKids` (misma consulta que `hooks/useKids.ts`) y `addKid` (insert + `fetchKids`).
   - Verificación: `npx tsc --noEmit` pasa y el store compila en un Client Component.
5. Refactorizar `components/kids/KidsList.tsx`: deja de recibir props, lee `kids`, `search`, `setSearch` e `isLoading` del store con selectores individuales, y calcula los grupos con `useMemo` sobre `filterKidsByName(kids, search)`. El buscador sigue siendo controlado con `value={search}` y `onChange={(e) => setSearch(e.target.value)}`.
   - Verificación: `npx tsc --noEmit` pasa y la grilla, los headers de sala y los contadores no cambian.
6. Refactorizar `components/kids/KidsSection.tsx`: usa `useKidsStore` para disparar `fetchKids()` en un `useEffect` al montar, y monta `<AddKidModal rooms={rooms} />` sin `onSaved`.
   - Verificación: `npx tsc --noEmit` pasa y entrar a `/kids` carga la lista una sola vez.
7. Refactorizar `components/kids/AddKidModal.tsx` con React Hook Form:
   - `useForm` con `zodResolver(addKidSchema)`, `mode: "onBlur"` y `defaultValues` vacíos.
   - Los `CustomInput` de nombre, fecha y alergias, el `<select>` de sala y el `<textarea>` de notas quedan **no controlados**: se les pasa `{...register("name")}`, `{...register("birthDate")}`, `{...register("allergies")}`, `{...register("room")}` y `{...register("medicalNotes")}`. Se saca el estado `form`, `errors` y `fieldRefs`.
   - El mensaje de error de cada campo sale de `formState.errors` (`errors.name?.message`), igual que hoy se pasa `error={errors.name}`.
   - El `max` de la fecha sigue siendo `todayISO()` calculado al abrir el modal.
   - `onSubmit` arma el payload (`room_id`, `full_name`, `birth_date`, `medical_notes`, `allergy_tags`) y llama a `addKid` del store; si la promesa rechaza, se muestra `SAVE_ERROR_MESSAGE` y el modal sigue abierto.
   - El botón "Guardar" se deshabilita con `formState.isSubmitting` y muestra "Guardando…" mientras dura la operación.
   - Verificación: `npx tsc --noEmit` pasa.
8. Borrar `hooks/useKids.ts`.
   - Verificación: `grep -rn "useKids" app components data hooks stores schemas` no devuelve resultados y `npx tsc --noEmit` sigue pasando.
9. Correr `npm run lint`, `npx tsc --noEmit`, `npm run build` y `node scripts/canonical-classes.mjs`.
   - Verificación: los cuatro pasan sin errores ni clases no canónicas nuevas.
10. Verificación manual con Playwright (dev server en `http://localhost:3000`): login con `fededmartinez@gmail.com` / `abc12345`, entrar a `/kids`, comprobar que se listan los 2 niños de la base, que el buscador filtra, que al abrir "Agregar niño" y salir de un campo vacío aparece el error, que una fecha futura muestra "La fecha no puede ser futura", y que un alta válida deja la tarjeta del niño nuevo en la grilla de su sala. No debe haber errores en consola.

## Criterios de aceptación

- [x] `package.json` declara `zustand`, `react-hook-form`, `@hookform/resolvers` y `zod` en `dependencies`, y `package-lock.json` está actualizado.
- [x] `stores/kids-store.ts` exporta `useKidsStore` con `kids`, `search`, `isLoading`, `error`, `setSearch`, `fetchKids` y `addKid`.
- [x] `hooks/useKids.ts` no existe y `grep -rn "useKids" app components data hooks stores schemas` no devuelve resultados.
- [x] `fetchKids` consulta `public.children` con `status = 'active'`, la sala embebida (`rooms(id, name)`) y orden por `full_name`, usando el cliente de navegador de `utils/supabase/client.ts`.
- [x] `fetchKids` se dispara desde un `useEffect` de `components/kids/KidsSection.tsx` al montar `/kids`, y no al crearse el store.
- [x] La consulta a `children` sigue siendo **una sola** por carga: no hay una consulta por sala ni un fetch adicional en `KidsList`.
- [x] La búsqueda filtra por `full_name` ignorando mayúsculas y acentos ("sofia" deja a "Sofía"), y escribir en el buscador no hace una consulta nueva a Supabase.
- [x] `schemas/add-kid-schema.ts` exporta `addKidSchema` y el tipo `AddKidFormValues`.
- [x] `AddKidModal` usa `useForm` con `zodResolver(addKidSchema)` y `mode: "onBlur"`.
- [x] `AddKidModal` no mantiene estado propio de los valores del formulario: no quedan `form`, `errors` ni `fieldRefs` en el componente.
- [x] Nombre vacío o de solo espacios muestra "Este campo es obligatorio" bajo el campo, al salir del campo y también al pulsar "Guardar".
- [x] Una fecha de nacimiento futura muestra "La fecha no puede ser futura" bajo el campo de fecha.
- [x] Sala sin elegir muestra "Este campo es obligatorio" bajo el select de sala.
- [x] Al pulsar "Guardar" con un campo inválido, el foco va al primer campo inválido en el orden nombre → fecha → sala.
- [x] El `max` del `<input type="date">` sigue siendo la fecha de hoy.
- [x] El insert manda exactamente las claves `room_id`, `full_name`, `birth_date`, `medical_notes` y `allergy_tags`.
- [x] `full_name` y `medical_notes` van recortados; `medical_notes` es `null` cuando el textarea está vacío.
- [x] `allergy_tags` es el texto de alergias partido por `,`, con cada trozo en `trim()` y sin trozos vacíos; texto vacío produce `[]`.
- [x] El insert no manda `enrolled_at`, `photo_consent` ni `status`.
- [x] Mientras el insert está en vuelo, el botón "Guardar" queda deshabilitado y muestra "Guardando…", y un segundo envío no dispara otro insert.
- [x] Si el insert falla, el modal sigue abierto, se muestra "No se pudo guardar el niño. Intentá de nuevo." y el formulario conserva los valores tipeados.
- [x] Si el insert tiene éxito, el modal se cierra, el formulario queda reseteado para la próxima apertura y la lista se recarga con el niño nuevo en el bloque de su sala.
- [x] `AddKidModal` ya no recibe la prop `onSaved`: la recarga la hace `addKid` dentro del store.
- [x] `hooks/useRooms.ts` y `hooks/useSession.ts` siguen siendo hooks y no usan Zustand.
- [x] La UI de `/kids` no cambia: mismos headers de sala, contadores, tarjetas y buscador; el header de la pantalla conserva el kicker "GESTIÓN", el título "Niños" y el botón "Agregar niño".
- [x] `npm run lint`, `npx tsc --noEmit`, `npm run build` y `node scripts/canonical-classes.mjs` pasan sin errores.

## Decisiones

- **Sí:** Zustand como manejador de estado global, con **un store por feature** (`stores/kids-store.ts`). El repo ya separa por feature (`components/`, `data/`, `hooks/`); un store único quemezcle niños, salas y sesión sería una bolsa de estado sin dueño.
- **Sí:** el store es el "dispatcher": `fetchKids` y `addKid` son acciones async que hablan con Supabase. La lógica de red deja de estar en un hook y pasa a estar en la capa de estado, que es lo que la hace reutilizable desde cualquier componente.
- **Sí:** `hooks/useKids.ts` **se elimina**. Zustand ya es la capa de estado; dejar el hook como wrapper sería indirección sin valor. Los componentes usan `useKidsStore` directo.
- **No:** un provider de contexto por request ni un store por request. La guía de Zustand para Next.js lo desaconseja explícitamente: los RSC no leen ni escriben el store y el store no se comparte entre peticiones. Acá el store vive solo en el cliente.
- **No:** el middleware `persist` (localStorage). Los niños viven en la base y el store no debe cachear filas entre sesiones: una lista vieja en localStorage es peor que no tener cache.
- **No:** Zustand para salas, sesión o feed. `useRooms` y `useSession` son hooks de un solo consumidor; migrarlos sin necesidad suma riesgo sin ganancia. Cada store nuevo entra con su propio spec.
- **Sí:** `search` vive en el store, junto con la lista. Es el estado que comparten el input y la grilla, y el motivo de que el store sea global y no un simple caché de datos.
- **Sí:** el estado derivado (`filteredKids`) **no** vive en el store. Zustand no cachea arrays derivados y devolver uno nuevo desde un selector rompe la igualdad de referencia en cada render; el filtro se calcula con `useMemo` en `KidsList` sobre `filterKidsByName(kids, search)`.
- **Sí:** selectores individuales (`useKidsStore((s) => s.kids)`, etc.) en vez de un selector que devuelve un objeto. Zustand v5 quitó la igualdad superficial por defecto: un objeto nuevo por render re-renderiza de más. Con `useShallow` sería equivalente, pero con un solo campo por selector no hace falta.
- **Sí:** React Hook Form con `zodResolver`. `useForm` reemplaza el estado de formulario a mano y `handleSubmit` garantiza que la validación corra antes del insert.
- **Sí:** Zod v4 (`zod@4.6.7`) como schema, con `@hookform/resolvers@7.0.2`, que ya soporta Zod v4 y los tipos se infieren del schema. El tipo del formulario se deriva con `z.infer`, no se escribe a mano.
- **Sí:** `mode: "onBlur"`. El error de cada campo aparece al salir del campo, sin obligar a enviar para enter. Es un cambio deliberado respecto del comportamiento actual (todo junto al enviar), pedido en la definición de este spec.
- **Sí:** el schema vive en `schemas/add-kid-schema.ts` (carpeta nueva, top-level). Es una definición de validación reutilizable, no un dato ni un componente: `data/` es para datos y `components/` para UI.
- **Sí:** el `trim()` de Zod hace el recorte de `name` y `medical_notes`, y el `refine` de la fecha compara contra `todayISO()` **en el momento de validar**. El `max` del input sigue siendo ayuda visual, no la garantía.
- **No:** `z.iso.date()` para la fecha. El `<input type="date">` ya entrega "YYYY-MM-DD" o vacío; el mensaje de formato sería inalcanzable para el usuario.
- **No:** validar el `room_id` como uuid. El id viene de `public.rooms` y su formato es responsabilidad de la base.
- **Sí:** el insert vive en el store (`addKid`) y el modal solo arma el payload. La escritura y la lectura de `children` quedan en el mismo lugar, y el modal deja de saber de Supabase.
- **Sí:** `addKid` **rechaza** la promesa si el insert falla, en vez de guardar el error en el store. `error` es el error de la consulta de la lista; el error del alta es estado del formulario (mensaje inline) y el `console.error` crudo mantiene el detalle para desarrollo.
- **Sí:** tras un insert exitoso, `addKid` llama a `fetchKids()`. Se mantiene el refetch de SPEC 17: una sola fuente de verdad y nada de actualización optimista que haya que revertir.
- **No:** actualización optimista de la lista tras el alta. El refetch es una consulta y evita el caso de una tarjeta que hay que sacar si el insert falló.
- **No:** cambiar el aspecto del modal, los mensajes de error ni el flujo de foco. Solo cambia el motor de validación.
- **No:** tests automatizados. El repo no tiene runner; la verificación es `lint` + `tsc` + `build` + Playwright manual.

## Riesgos

| Riesgo                                                                                                                             | Mitigación                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Un store a nivel de módulo es un singleton por pestaña: si dos pantallas lo usaran, compartirían estado.                           | Hoy solo `/kids` lo consume. Si aparece un segundo consumidor, se evalúa un store por request o un provider (decisión de otro spec).                              |
| `search` global sobrevive a la navegación: al volver a `/kids` el filtro sigue aplicado.                                           | Es el comportamiento propio de un estado global. Si molesta, el `search` se puede resetear al montar la pantalla.                                                 |
| Zustand v5 quitó la igualdad superficial por defecto: un selector que devuelve un objeto nuevo re-renderiza en cada cambio.        | El repo usa selectores de un solo campo. Si alguna vez hace falta un objeto, se usa `useShallow`.                                                                 |
| `zodResolver` infiere `input` y `output` por separado: si el schema tuviera `.default()`, un único genérico en `useForm` rompería. | El schema no usa `.default()`: `input` y `output` son idénticos y `z.infer` sirve para los dos. Si alguien agrega `.default()`, hay que pasar los tres genéricos. |
| Cambiar a `mode: "onBlur"` hace que los errores aparezcan antes (al salir del campo) que antes (al enviar).                        | Es una decisión de producto de este spec. El mensaje y el texto de los campos no cambian.                                                                         |
| `register` deja los inputs sin controlar: un `value`/`onChange` manual junto al `register` rompe el formulario.                    | Los inputs del modal no llevan `value` ni `onChange` propios; el buscador de la lista sigue controlado por el store, que es otro componente.                      |
| El refetch tras el alta muestra los skeletons de carga en medio de la grilla.                                                      | Es el comportamiento de SPEC 16/17 y no cambia.                                                                                                                   |
| Sin policies y sin datos, este spec no se puede verificar end-to-end.                                                              | No aplica: la migración de RLS ya está aplicada y `children` tiene 2 filas (verificado por MCP el 2026-11-04).                                                    |

## Qué NO está en este spec

- Zustand para salas, sesión, feed o cualquier otra pantalla: cada store nuevo entra con su propio spec.
- Persistencia en localStorage con el middleware `persist`.
- Un store por request, un provider de contexto o el uso del store desde Server Components.
- React Hook Form en el login, el register, "Vincular padre", "Nueva publicación" o el perfil del niño.
- Zod como validación del payload en el servidor, o schemas para otras entidades.
- Validación del `room_id` como uuid y validación del formato de fecha con `z.iso.date()`.
- Cualquier cambio visual en el modal, el listado o la tarjeta.
- Cambios de esquema, migraciones, seeds, `parent_children`, el perfil del niño (`/kids/[id]`) y la traducción de los tags de alergia.
- Tests automatizados.

Cada una de esas, si aterriza, va en su propio spec.
