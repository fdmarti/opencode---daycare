# SPEC 21 — Stores de Zustand para salas y sesión

> **Estado:** Approved
> **Depende de:** SPEC 19 (estado global con Zustand), SPEC 20 (perfil del niño desde la base), SPEC 14 (datos de sesión)
> **Fecha:** 2026-11-04
> **Ubicación:** `specs/app/21-rooms-and-session-stores.md` (spec de app: no cambia el esquema de la base)
> **Objetivo:** Reemplazar los hooks `useRooms` y `useSession` por dos stores de Zustand (`rooms-store` y `session-store`) que pasan a ser el dueño de las salas y del logout.

## Por qué existe este spec

SPEC 19 dejó explícitamente afuera de su alcance Zustand para salas y sesión, con la regla de que "cada store nuevo entra con su propio spec". Este spec es esa pieza.

Hoy quedan dos hooks de estado local que se contradicen con el resto del repo:

- `hooks/useRooms.ts` es el dueño de las salas, pero su estado es local al componente: cada consumidor tendría su propia instancia y su propia consulta a `public.rooms`.
- `hooks/useSession.ts` es el dueño de los datos del usuario, y su estado también es local: el `Sidebar` lo consume, y no hay forma de que otro componente (o el propio logout) escriba en esa sesión.

Además, el logout vive en `actions/auth.ts` como Server Action y el botón del `Sidebar` es un `<form action={logout}>`: el estado de la sesión y la acción que termina la sesión están en dos capas que no se hablan, y el store no puede limpiar lo que el hook tiene en memoria.

Este spec unifica las tres cosas en un único lugar por feature: dos stores de Zustand, un store por dominio, con el patrón ya establecido en SPEC 19 (el store es el dueño de la red, el fetch se dispara desde un `useEffect` del componente y se leen selectores de un solo campo).

## Alcance

**En:**

- `stores/rooms-store.ts` (nuevo): store de Zustand con `rooms`, `isLoading`, `error` y la acción `fetchRooms`. Mueve la consulta de `public.rooms` que hoy vive en `hooks/useRooms.ts`.
- `stores/session-store.ts` (nuevo): store de Zustand con los datos de sesión (`fullName`, `firstName`, `initial`, `roleLabel`, `daycareName`), `isLoading` y las acciones `fetchSession` y `logout`.
- `hooks/useRooms.ts`: **se elimina**. Ningún archivo del repo lo importa.
- `hooks/useSession.ts`: **se elimina**. Ningún archivo del repo lo importa. La carpeta `hooks/` queda vacía y se elimina.
- `components/kids/AddKidModal.tsx`: deja de recibir la prop `rooms` y lee las salas del store.
- `components/kids/KidsSection.tsx`: deja de usar `useRooms`; dispara `fetchRooms()` en un `useEffect` al montar y monta `<AddKidModal />` sin props.
- `components/layout/Sidebar.tsx`: deja de usar `useSession`; lee la sesión del store, dispara `fetchSession()` en un `useEffect` al montar y convierte el botón de logout en un `<button>` con `onClick` que llama a la acción `logout` del store.
- `actions/auth.ts`: **no se toca**. La Server Action `logout()` sigue siendo la que borra la sesión en el servidor y redirige a `/login`; el store la delega.
- Comentarios y documentación que apuntan a los hooks borrados: `utils/session.ts`, `stores/kids-store.ts` y la sección de estructura de `AGENTS.md`.

**Fuera del alcance (para specs futuros):**

- Zustand para el feed, los avisos o cualquier otra pantalla: cada store nuevo entra con su propio spec.
- Persistencia con el middleware `persist` (localStorage): la base es la fuente de verdad y el store no cachea datos entre sesiones.
- Suscribirse a `onAuthStateChange` de Supabase para refrescar la sesión sola: el fetch es único, disparado por el `Sidebar`.
- Un store por request ni un provider de contexto: la documentación de Zustand para Next.js desaconseja ambos.
- Cambios en la Server Action `logout()` o en `proxy.ts`: el mecanismo de cookies y la política de rutas quedan intactos.
- `signOut` adicional desde el cliente de navegador: el comportamiento de cierre de sesión es exactamente el de hoy.
- Cambios visuales en `/kids`, en el `Sidebar` o en el modal de alta.
- Cambios de esquema, migraciones o seeds.
- Tests automatizados: el repo no tiene runner de tests.
- Reescribir SPEC 19: sus criterios quedan como registro histórico, aunque el de "useRooms y useSession siguen siendo hooks" quede obsoleto.

## Modelo de datos

### Store de salas

```ts
// stores/rooms-store.ts

export interface RoomsStoreState {
  /** Filas de `public.rooms`, ordenadas por nombre. */
  rooms: RoomRow[];
  /** true mientras la consulta está en vuelo. */
  isLoading: boolean;
  /** Error de la consulta, si lo hubo. */
  error: Error | null;
  /** Consulta `public.rooms` y reemplaza la lista. */
  fetchRooms: () => Promise<void>;
}
```

Reglas del store:

- `fetchRooms` hace **exactamente** la consulta de `hooks/useRooms.ts`: `supabase.from("rooms").select("id, name").order("name")` con el cliente de navegador de `utils/supabase/client.ts` y `overrideTypes<RoomRow[], { merge: false }>()`. Sin cambios en la consulta.
- `fetchRooms` pone `isLoading = true` mientras vuela, y en error deja `rooms = []`, `error` con el error de Supabase e `isLoading = false`.
- El estado inicial es `rooms: []`, `isLoading: true`, `error: null`: replica el `useState(true)` del hook, que hoy muestra el selector de salas vacío hasta que llegan.
- El store no guarda estado derivado ni filtra por guardería: el aislamiento lo resuelven las policies de RLS.

### Store de sesión

```ts
// stores/session-store.ts

export interface SessionStoreState extends SessionData {
  /** true mientras se resuelve la sesión; false cuando ya hay datos (o falló). */
  isLoading: boolean;
  /** Lee el usuario de Supabase y deriva los datos visibles. */
  fetchSession: () => Promise<void>;
  /** Cierra sesión y vuelve al login. */
  logout: () => Promise<void>;
}
```

`SessionData` no se redefine: se reusa el tipo de `utils/session.ts` (`fullName`, `firstName`, `initial`, `roleLabel`, `daycareName`), que también sigue usándolo el Server Component `components/feed/FeedHeader.tsx`.

Reglas del store:

- El estado inicial es `{ ...EMPTY_SESSION, isLoading: true }`: el `Sidebar` muestra el skeleton desde el primer paint, igual que hoy con el hook.
- `fetchSession` usa `supabase.auth.getUser()` —**no** `getSession()`— para leer la metadata vigente del servidor, aunque el JWT guardado en la cookie tenga claims viejos.
- `fetchSession` deriva los datos con `deriveSessionData(user)` de `utils/session.ts`; no reimplementa la derivación.
- `fetchSession` **no** guarda un campo `error`: si la lectura falla (red caída), deja `{ ...EMPTY_SESSION, isLoading: false }` y no muestra skeleton infinito. Es el comportamiento del hook actual.
- La metadata se usa solo para mostrar: nunca para autorizar.
- `logout` delega en la Server Action `logout()` de `actions/auth.ts` (que hace `signOut` en el servidor y `redirect("/login")`) y, sin importar cómo resuelva, deja el estado de sesión en `{ ...EMPTY_SESSION, isLoading: false }`.
- El store **no** llama a `supabase.auth.signOut()` por su cuenta: la sesión se borra en el servidor, igual que hoy.

### API de los componentes

```ts
// components/kids/AddKidModal.tsx
export function AddKidModal(): JSX.Element; // sin props: lee las salas del store

// components/kids/KidsSection.tsx
export function KidsSection(): JSX.Element;

// components/layout/Sidebar.tsx
export function Sidebar(): JSX.Element;
```

`AddKidModal` pierde la prop `rooms` y con ella la interfaz `AddKidModalProps`: el componente no recibe props.

### Disparadores de los fetch

Los tres fetch se disparan desde un `useEffect` del componente que los necesita, nunca al crearse el store (mismo criterio que SPEC 19):

| Fetch          | Componente                        | Cuándo                       |
| -------------- | --------------------------------- | ---------------------------- |
| `fetchRooms`   | `components/kids/KidsSection.tsx` | al montar `/kids`            |
| `fetchKids`    | `components/kids/KidsSection.tsx` | al montar `/kids`            |
| `fetchSession` | `components/layout/Sidebar.tsx`   | al montar el shell de la app |

`KidsSection` dispara `fetchRooms()` y `fetchKids()` en el mismo `useEffect`: son dos consultas independientes (salas y niños) y ninguna espera a la otra.

## Plan de implementación

1. Crear `stores/rooms-store.ts` con `create<RoomsStoreState>()(...)`: estado inicial (`rooms: []`, `isLoading: true`, `error: null`) y `fetchRooms` con la misma consulta del hook.
   - Verificación: `npx tsc --noEmit` pasa y el store compila en un Client Component.
2. Crear `stores/session-store.ts` con `create<SessionStoreState>()(...)`: estado inicial (`{ ...EMPTY_SESSION, isLoading: true }`), `fetchSession` (misma lectura con `getUser()` que el hook) y `logout` (delega en la Server Action y resetea el estado).
   - Verificación: `npx tsc --noEmit` pasa y la Server Action se importa sin error en un módulo `"use client"`.
3. Refactorizar `components/kids/AddKidModal.tsx`: borrar la interfaz `AddKidModalProps` y la prop `rooms`; leer `rooms` con `useRoomsStore((state) => state.rooms)`. El selector de SALA, la opción "Elegí una sala" y el mensaje "No hay salas disponibles para esta guardería." quedan igual.
   - Verificación: `npx tsc --noEmit` pasa y `grep -rn "AddKidModalProps" components` no devuelve resultados.
4. Refactorizar `components/kids/KidsSection.tsx`: quitar el import de `useRooms`; en el `useEffect` de montaje, disparar `fetchRooms()` y `fetchKids()`; montar `<AddKidModal />` sin props.
   - Verificación: `npx tsc --noEmit` pasa y entrar a `/kids` hace una consulta a `rooms` y una a `children`.
5. Refactorizar `components/layout/Sidebar.tsx`: reemplazar `useSession()` por selectores individuales del store (`fullName`, `initial`, `roleLabel`, `daycareName`, `isLoading`), disparar `fetchSession()` en un `useEffect` al montar y reemplazar el `<form action={logout}>` por un `<button type="button" onClick={...}>` que llame a `logout` del store.
   - Verificación: `npx tsc --noEmit` pasa y el `Sidebar` ya no importa `actions/auth` ni `@/hooks/useSession`.
6. Borrar `hooks/useRooms.ts` y `hooks/useSession.ts`, y la carpeta `hooks/` que queda vacía.
   - Verificación: `grep -rn "useRooms\|useSession" app components data hooks stores schemas utils` no devuelve resultados y `npx tsc --noEmit` sigue pasando.
7. Actualizar las referencias a los hooks borrados: el comentario de `utils/session.ts` y el de `stores/kids-store.ts` pasan a apuntar a `stores/session-store.ts`; la sección de estructura de `AGENTS.md` describe la carpeta `stores/` con los tres stores y ya no menciona `hooks/`.
   - Verificación: `grep -rn "hooks/" AGENTS.md utils stores components` no devuelve resultados y `npx tsc --noEmit` pasa.
8. Correr `npm run lint`, `npx tsc --noEmit`, `npm run build` y `node scripts/canonical-classes.mjs`.
   - Verificación: los cuatro pasan sin errores ni clases no canónicas nuevas.

## Criterios de aceptación

- [ ] `stores/rooms-store.ts` exporta `useRoomsStore` con `rooms`, `isLoading`, `error` y `fetchRooms`.
- [ ] `stores/session-store.ts` exporta `useSessionStore` con `fullName`, `firstName`, `initial`, `roleLabel`, `daycareName`, `isLoading`, `fetchSession` y `logout`.
- [ ] `hooks/useRooms.ts` y `hooks/useSession.ts` no existen, la carpeta `hooks/` no existe y `grep -rn "useRooms\|useSession" app components data stores schemas utils` no devuelve resultados.
- [ ] `fetchRooms` consulta `public.rooms` con `select("id, name")` y `order("name")`, usando el cliente de navegador de `utils/supabase/client.ts`.
- [ ] `fetchRooms` se dispara desde el `useEffect` de `components/kids/KidsSection.tsx` al montar `/kids`, y no al crearse el store.
- [ ] `fetchSession` usa `supabase.auth.getUser()` (no `getSession()`) y deriva los datos con `deriveSessionData` de `utils/session.ts`.
- [ ] `fetchSession` se dispara desde el `useEffect` de `components/layout/Sidebar.tsx` al montar el shell de la app, y no al crearse el store.
- [ ] Mientras `isLoading` es `true`, el `Sidebar` muestra el skeleton del avatar y del texto; cuando termina, muestra la inicial, el nombre y el rol.
- [ ] Si la lectura de la sesión falla, el `Sidebar` queda sin skeleton y sin datos, sin quedar cargando indefinidamente.
- [ ] `logout` del store llama a la Server Action `logout()` de `actions/auth.ts` y deja el estado de sesión en `{ ...EMPTY_SESSION, isLoading: false }`.
- [ ] El botón de logout del `Sidebar` es un `<button type="button">` con `onClick`: ya no es un `<form action={logout}>`.
- [ ] `actions/auth.ts` y `proxy.ts` no cambian: el cierre de sesión sigue borrando la cookie en el servidor y redirigiendo a `/login`.
- [ ] `AddKidModal` no recibe la prop `rooms` ni declara `AddKidModalProps`: lee las salas del store.
- [ ] El selector "SALA" del modal de alta sigue mostrando la opción "Elegí una sala", las salas del store y el mensaje "No hay salas disponibles para esta guardería." cuando la lista está vacía.
- [ ] La UI de `/kids` y del `Sidebar` no cambia: mismos headers de sala, contadores, tarjetas, buscador, avatar y botón de logout.
- [ ] `AGENTS.md` ya no menciona la carpeta `hooks/` y describe los tres stores de la carpeta `stores/`.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run build` y `node scripts/canonical-classes.mjs` pasan sin errores.

## Decisiones

- **Sí:** dos stores separados, `stores/rooms-store.ts` y `stores/session-store.ts`. Un store por feature, igual que `kids-store` y `kid-profile-store`: un store único que mezcle salas y sesión sería una bolsa de estado sin dueño claro.
- **Sí:** los hooks se eliminan, no quedan como wrappers. Mismo criterio que SPEC 19 con `useKids`: Zustand ya es la capa de estado y el hook sería indirección sin valor.
- **Sí:** el store de sesión **extiende** `SessionData` de `utils/session.ts` en vez de definir su propia forma. La derivación (`deriveSessionData`, `EMPTY_SESSION`) es la misma que usa el Server Component `components/feed/FeedHeader.tsx`, y no se toca.
- **Sí:** `fetchSession` no guarda un campo `error`. El hook actual no lo tiene y el `Sidebar` no lo muestra: un fallo de red deja la sesión vacía y sin skeleton, sin mensaje de error.
- **Sí:** `isLoading` arranca en `true` en los dos stores. El `Sidebar` muestra un skeleton y el selector de salas arranca vacío; con `false` inicial habría un flash de avatar y nombre vacíos antes de que arranque la consulta.
- **Sí:** el logout **entra** al store de sesión. Con el logout como Server Action en el `<form>`, el estado de la sesión y la acción que la termina estaban en dos capas que no se hablan; el store de sesión es el dueño natural de las dos cosas.
- **Sí:** el store delega en la Server Action `logout()` de `actions/auth.ts`. Borrar la sesión en el servidor es lo que mantiene consistente el mecanismo de cookies con `proxy.ts`; el store no necesita reimplementarlo.
- **Sí:** el botón del `Sidebar` pasa a `<button type="button" onClick>`. Un `<form>` con Server Action no permite que el store intervenga en el flujo.
- **No:** `supabase.auth.signOut()` desde el cliente de navegador como paso previo. El comportamiento de hoy (logout en el servidor) funciona y ya está verificado; agregar un segundo `signOut` sería una segunda fuente de verdad sobre la sesión.
- **No:** suscribirse a `onAuthStateChange` para refrescar la sesión automáticamente. El fetch único disparado por el `Sidebar` cubre el caso actual y no agrega listeners que haya que limpiar.
- **No:** `persist` (localStorage). La sesión y las salas viven en la base; una copia vieja en el navegador es peor que no tener copia.
- **No:** un store por request, un provider de contexto o leer el store desde Server Components. La guía de Zustand para Next.js lo desaconseja y el repo no lo necesita.
- **No:** cambiar la UI del selector de salas (deshabilitarlo o mostrar "Cargando salas…" mientras `isLoading`). Esta spec es una migración de capa de estado: la UI no cambia.
- **No:** reescribir el criterio obsoleto de SPEC 19 ("`hooks/useRooms.ts` y `hooks/useSession.ts` siguen siendo hooks"). Los specs son registros históricos: este spec lo reemplaza.
- **No:** tests automatizados ni verificación visual con Playwright. El repo no tiene runner de tests y este spec no cambia la UI: la verificación es `lint` + `tsc` + `build`.

## Riesgos

| Riesgo                                                                                                                                | Mitigación                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Un store a nivel de módulo es un singleton por pestaña: los datos de la sesión sobreviven a la navegación dentro de la app.           | Es el comportamiento propio de un estado global. Al cerrar sesión el store se resetea; al volver a loguearse la página se recarga y el store arranca limpio. |
| `isLoading` arranca en `true`: si el componente que dispara el fetch nunca se monta, el estado queda en "cargando" para siempre.      | Los tres fetch se disparan desde el `Sidebar` y desde `KidsSection`, que son exactamente los componentes que dibujan el skeleton y el selector de salas.     |
| La Server Action `logout()` redirige a `/login` desde el servidor: el estado del store se resetea después de que la promesa resuelva. | El reseteo va en un `finally`, así que ocurre tanto en el camino feliz como si la acción fallara.                                                            |
| Importar una Server Action (`actions/auth.ts`) dentro de un módulo `"use client"` (el store) cambia su forma de invocación.           | Next.js la expone como referencia invocable desde el cliente: es el mismo patrón que ya usa el repo con `actions/auth.ts` en el `Sidebar`.                   |
| El `Sidebar` pasa a leer selectores individuales del store: un selector mal elegido re-renderiza de más.                              | Se usan selectores de un solo campo (`useSessionStore((s) => s.fullName)`, etc.), igual que en SPEC 19.                                                      |
| La consulta a `rooms` queda en el store y el modal la lee: si el store no se dispara, el selector queda vacío.                        | `fetchRooms` se dispara en el `useEffect` de `KidsSection`, que monta el modal en la misma pantalla.                                                         |

## Qué NO está en este spec

- Zustand para el feed, los avisos, la cuenta o cualquier otra pantalla: cada store nuevo entra con su propio spec.
- Persistencia en localStorage con el middleware `persist`.
- Un store por request, un provider de contexto o el uso del store desde Server Components.
- Suscripción a `onAuthStateChange`, refresh automático de la sesión o una acción `refreshSession` expuesta.
- Cambios en `actions/auth.ts`, en `proxy.ts`, en el mecanismo de cookies o en la política de rutas.
- Un `signOut` adicional desde el cliente de navegador.
- Cambios visuales en `/kids`, en el `Sidebar`, en el selector de salas o en el modal de alta.
- Cambios de esquema, migraciones, seeds y policies de RLS.
- Tests automatizados y verificación visual con Playwright.
- Reescribir o marcar como obsoleto SPEC 19.

Cada una de esas, si aterriza, va en su propio spec.
