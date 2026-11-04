# SPEC 20 — Perfil del niño desde la base de datos

> **Estado:** Approved
> **Depende de:** SPEC 15 (tablas `children` y `rooms`), SPEC 16 (listado de niños desde la base), SPEC 17 (alta real de niños), SPEC 18 (policies de RLS de `rooms` y `children`)
> **Fecha:** 2026-11-04
> **Ubicación:** `specs/app/20-kid-profile-from-database.md` (spec de app: store + UI; no cambia el esquema)
> **Objetivo:** Mostrar la vista de perfil del niño en `/kids/[id]` con la fila real de `public.children`, replicando `references/pantallas/perfil-nino.dc.html`, con la sección de padres vinculada vacía y sin funcionalidad.

## Por qué existe este spec

SPEC 04 implementó el perfil sobre `data/kids/mock-kids.ts`. SPEC 16 eliminó ese mock, movió el listado de `/kids` a la base y dejó `/kids/[id]` **redirigiendo a `/kids`**: hoy el click en una tarjeta del listado vuelve al listado y no hay vista de perfil.

Este spec reconstruye el perfil con los datos reales de `public.children` y conecta la tarjeta del listado con él. La sección "PADRES VINCULADOS" queda **vacía y sin funcionalidad**: la tabla `parent_children` no existe todavía, así que no hay datos de padres que mostrar.

Estado de la base remota verificado por MCP (2026-11-04):

- `public.children` tiene **3 filas**, `public.rooms` **4** y `public.users` **1**; `pg_policies` devuelve **8 policies** en `public` (SPEC 18 aplicada).
- **`parent_children` no existe**: no hay forma de listar padres ni invitaciones.
- `children` tiene `enrolled_at` y `medical_notes`, que el perfil necesita (fila "Ingreso" y bloque de notas) y el listado actual no trae.
- Los niños sembrados son de prueba (`Esteban Quito`, `Federico Martinez`, `Tomas Martinez`); **no se tocan** en este spec.

## Alcance

**En:**

- `data/kids/types.ts`: `ChildWithRoomRow` gana `enrolled_at: string` y `medical_notes: string | null`. Un solo tipo de niños en el repo (SPEC 16): la lista y el perfil consumen la misma fila.
- `stores/kids-store.ts`: el `select` de la lista pasa a incluir `enrolled_at` y `medical_notes`, para que el tipo declarado siga siendo honesto con lo que trae la consulta.
- `stores/kid-profile-store.ts` (nuevo): store Zustand `useKidProfileStore` con `{ child, isLoading, error, fetchKid }`. Es el dueño de la red, igual que `stores/kids-store.ts`.
- `components/kids/KidProfile.tsx`: reescrito para consumir la fila de la base (prop `child: ChildWithRoomRow`), sin los tipos del mock. Mantiene la composición del mockup: link "Volver a Niños", cabecera, bloque de alergias, card de datos, CTA "Resumen del día" y panel "PADRES VINCULADOS".
- `components/kids/KidProfileSkeleton.tsx` (nuevo): placeholder con la forma del perfil mientras carga la consulta.
- `components/kids/KidProfileSection.tsx` (nuevo, Client Component): orquesta los cuatro estados — cargando, error, no encontrado y perfil.
- `components/kids/KidProfileRoute.tsx` (nuevo, Server Component async): resuelve `params` y monta la sección.
- `app/(app)/kids/[id]/page.tsx`: deja de redirigir. Sigue siendo Server Component, tipa sus props con `PageProps<"/kids/[id]">` y envuelve la resolución de `params` en `<Suspense>` con el skeleton como fallback.
- `data/kids/profile-types.ts`: **se elimina**. `Kid` y `KidParent` quedan sin uso (no hay padres) y el perfil se construye sobre la fila de la base.
- `components/kids/LinkParentModal.tsx`: **se conserva sin uso** (ningún archivo lo importa). Queda listo para el spec de vinculación de padres.
- `components/kids/KidNotFound.tsx`: **se reutiliza tal cual**, sin cambios.

**Fuera del alcance (para specs futuros):**

- `parent_children`, `invitations` y la vinculación real de padres: el botón "Vincular otro padre" queda sin funcionalidad.
- Editar niño (`agregar-nino.dc.html`): el botón "Editar" queda como link muerto `#`.
- Resumen del día (`resumen-dia.dc.html`): el CTA queda como link muerto `#`.
- Traducir los tags de alergia al español: se muestran tal como los guardó el usuario (`mani`, `peras`).
- Avatar con color o inicial por niño: se mantiene el `Avatar` genérico del repo (SPEC 04).
- Semántica del `status` (`active` / `archived`) más allá del filtro `active` de la consulta.
- Seed de niños, policies nuevas o cualquier cambio de esquema: es un spec de app.
- Cambios en SPEC 03, 04, 15, 16, 17 y 18 (registro histórico).

## Modelo de datos

### Tipo de la fila (único)

```ts
// data/kids/types.ts

/** Fila de `public.rooms`. */
export interface RoomRow {
  id: string;
  name: string; // "Rojo" → "Sala Rojo"
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
  enrolled_at: string; // "2025-02-01" (YYYY-MM-DD) → fila "Ingreso"
  medical_notes: string | null; // texto libre de notas médicas
  allergy_tags: string[]; // ["peanut"] — se muestran tal cual
  room_id: string;
  rooms: RoomRow | null; // null si la sala no es visible (RLS)
}
```

Convenciones:

- No hay tipo de vista intermedio: la UI consume la fila de la base (SPEC 16).
- La edad no está en la base: se deriva de `birth_date` con `ageFromBirthDate` (`utils/kids.ts`).
- `enrolled_at` se muestra como mes y año ("nov 2026"); `birth_date` como día, mes y año ("12 mar 2022").
- `medical_notes` es `null` cuando no hay notas: el bloque de alergias se oculta si no hay tags **ni** notas.
- `allergy_tags` se muestran tal cual, separados por ", " en la tarjeta y como badges sueltos en el perfil.

### Store del perfil

```ts
// stores/kid-profile-store.ts

export interface KidProfileStoreState {
  /** El niño cargado; `null` si no existe o todavía no se consultó. */
  child: ChildWithRoomRow | null;
  /** true mientras la consulta está en vuelo. */
  isLoading: boolean;
  /** Error de la consulta, si lo hubo. */
  error: Error | null;
  /** Consulta `public.children` por id y guarda el resultado. */
  fetchKid: (id: string) => Promise<void>;
}

export const useKidProfileStore = create<KidProfileStoreState>()((set) => ({ ... }));
```

Convenciones:

- El fetch se hace en el navegador con `createClient()` de `utils/supabase/client.ts`, igual que `stores/kids-store.ts` y `hooks/useRooms.ts`: el JWT lleva el `app_metadata` y el aislamiento por guardería lo resuelven las policies de RLS.
- Consulta: `from("children").select("id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, room_id, rooms(id, name)").eq("id", id).eq("status", "active")`, con `.maybeSingle()` y `.overrideTypes(...)` con el tipo de la fila, siguiendo el patrón de `stores/kids-store.ts`.
- El filtro `status = 'active'` es el mismo que usa el listado: un niño archivado se trata como inexistente y cae en `KidNotFound` ("no existe o fue removido del listado").
- `fetchKid` pone `isLoading: true` y `child: null` al empezar: al navegar de un niño a otro nunca se ve el anterior.
- La sección "PADRES VINCULADOS" no consulta nada: no hay tabla de padres.

### Composición visual del perfil

Sobre `references/pantallas/perfil-nino.dc.html` y las decisiones de SPEC 04:

| Zona            | Contenido                                                                                                                                                                                                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Link superior   | "Volver a Niños" (`<Link href="/kids">`, chevron izquierdo 18px, `text-mute`, font-bold 14px)                                                                                                                                                                                       |
| Cabecera        | `<Avatar size="lg">` (84px), `<h1>` con `full_name` (Fredoka 28px), meta "N años · Sala {room}" y botón "Editar" (link muerto `#`)                                                                                                                                                  |
| Bloque alergias | Card blanca (`bg-card border-borde rounded-2xl`): icono de alerta, título "Alergias y notas" y **una fila de badges** con los `allergy_tags` (estilo de la lista: `bg-[#FBD8CC] text-[#D9684A]`, `rounded-full`, `text-[11px] font-extrabold`); debajo, el texto de `medical_notes` |
| Card de datos   | "Fecha de nacimiento" → "12 mar 2022"; "Sala" → nombre de la sala; "Ingreso" → "nov 2026"                                                                                                                                                                                           |
| CTA derecho     | "Resumen del día" (link muerto `#`, fondo `bg-tinta`, texto blanco)                                                                                                                                                                                                                 |
| Panel derecho   | "PADRES VINCULADOS" + botón "Vincular otro padre" **sin lista de padres y sin modal**                                                                                                                                                                                               |

Reglas:

- El bloque de alergias **no** se renderiza si no hay `allergy_tags` **y** no hay `medical_notes`.
- El botón "Vincular otro padre" conserva la estética del mockup (círculo punteado + texto `text-acento-editar`) pero es un `<button disabled>`: no hace nada y no abre `LinkParentModal`.
- Los helpers de fecha (`formatDayMonthYear`, `formatMonthYear`) se quedan en `components/kids/KidProfile.tsx`, como en SPEC 04: son dos formatos fijos y no justifican una librería de fechas.
- La edad se deriva con `ageFromBirthDate` (`utils/kids.ts`), no se calcula en el componente.

### Estados de la ruta

| Estado                 | Qué se renderiza                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| Cargando               | `<KidProfileSkeleton />` (skeletons con la forma del perfil)                                        |
| Error de la consulta   | Mensaje de texto dentro del shell: "No se pudo cargar el perfil del niño" (sin botón de reintentar) |
| Sin fila / id inválido | `<KidNotFound />` dentro del shell, con link "Volver a Niños"                                       |
| Con fila               | `<KidProfile child={child} />`                                                                      |

## Plan de implementación

1. Extender `data/kids/types.ts`: `ChildWithRoomRow` gana `enrolled_at: string` y `medical_notes: string | null`. Verificación: `npx tsc --noEmit` pasa.
2. Actualizar el `select` de `stores/kids-store.ts` para incluir `enrolled_at` y `medical_notes` (la lista sigue mostrando lo mismo). Verificación: `npx tsc --noEmit` pasa y `/kids` no cambia visualmente.
3. Crear `stores/kid-profile-store.ts` con `useKidProfileStore` (`child`, `isLoading`, `error`, `fetchKid`), siguiendo el patrón de `stores/kids-store.ts` (`createClient`, `.overrideTypes`, `set({ isLoading, error })`). Verificación: `npx tsc --noEmit` pasa.
4. Reescribir `components/kids/KidProfile.tsx` para consumir `ChildWithRoomRow`:
   - Prop `child: ChildWithRoomRow`; se eliminan los imports de `@/data/kids/profile-types` y los tipos `Kid`/`KidParent`.
   - Cabecera con `full_name`, meta `${ageFromBirthDate(child.birth_date)} años · Sala ${child.rooms?.name ?? ""}` y botón "Editar" muerto.
   - Bloque de alergias: card blanca con la fila de badges (`child.allergy_tags`) y debajo `child.medical_notes`; se oculta si no hay ninguno de los dos.
   - Card de datos con `birth_date` ("dd mmm yyyy"), sala y `enrolled_at` ("mmm yyyy").
   - CTA "Resumen del día" muerto y panel "PADRES VINCULADOS" con el botón "Vincular otro padre" deshabilitado y sin lista de padres.
     Verificación: `npx tsc --noEmit` pasa y el componente ya no importa tipos del mock.
5. Crear `components/kids/KidProfileSkeleton.tsx` con `Skeleton` (componente de SPEC 14): círculo 84px, dos barras de texto y dos bloques redondeados, con la misma retícula del perfil. Verificación: compila y se ve con la forma del perfil.
6. Crear `components/kids/KidProfileSection.tsx` (`"use client"`): lee el store, dispara `fetchKid(kidId)` en un `useEffect` con `kidId` como dependencia y renderiza skeleton / error / `KidNotFound` / `KidProfile` según el estado. Verificación: `npx tsc --noEmit` pasa.
7. Crear `components/kids/KidProfileRoute.tsx` (Server Component async): `const { id } = await params` y `<KidProfileSection kidId={id} />`. Verificación: compila.
8. Reescribir `app/(app)/kids/[id]/page.tsx`: Server Component con `PageProps<"/kids/[id]">`; `<Suspense fallback={<KidProfileSkeleton />}>` envuelve `<KidProfileRoute params={props.params} />`; se elimina el `redirect("/kids")`. Verificación: `npx tsc --noEmit` pasa y `/kids/<uuid>` ya no redirige.
9. Eliminar `data/kids/profile-types.ts`. Verificación: `grep -rn "profile-types" app components data hooks` no devuelve resultados.
10. Verificar que `components/kids/LinkParentModal.tsx` queda sin imports: `grep -rn "LinkParentModal" app components` no devuelve resultados. El archivo se conserva.
11. Correr `node scripts/canonical-classes.mjs --fix` y comprobar que el repo queda limpio de clases no canónicas. Verificación: el script no reporta nada.
12. Correr `npm run lint`, `npx tsc --noEmit` y `npm run build`. Verificación: los tres pasan sin errores. Si el build se queja por el acceso a `params` fuera de un `<Suspense>`, el paso 8 ya cubre ese caso: la page envuelve la resolución en `<Suspense>`.
13. Verificación manual con Playwright (dev server en `http://localhost:3000`): login con `fededmartinez@gmail.com` / `abc12345`, entrar a `/kids`, hacer click en una tarjeta y comprobar que se llega al perfil del niño con nombre, sala y filas; `/kids/<uuid-inexistente>` muestra "Niño no encontrado"; la consola no muestra errores. Guardar la captura en `.playwright-mcp/`.

## Criterios de aceptación

- [ ] `data/kids/types.ts` declara `ChildWithRoomRow` con `enrolled_at: string` y `medical_notes: string | null`, y no existe ningún otro tipo de niños en el repo.
- [ ] El `select` de `stores/kids-store.ts` incluye `enrolled_at` y `medical_notes`.
- [ ] `stores/kid-profile-store.ts` exporta `useKidProfileStore` con `child`, `isLoading`, `error` y `fetchKid(id)`.
- [ ] La consulta del perfil filtra por `id` y por `status = 'active'`, embebe la sala (`rooms(id, name)`) y se hace con el cliente de navegador de `utils/supabase/client.ts`.
- [ ] `fetchKid` limpia `child` a `null` y pone `isLoading: true` al empezar: al cambiar de niño no se ve el anterior.
- [ ] `/kids/[id]` **no** redirige: muestra el perfil del niño con id válido.
- [ ] El click en una tarjeta de `/kids` navega a `/kids/<id>` con `<Link>` (sin full reload) y muestra el perfil de ese niño.
- [ ] La cabecera muestra `<Avatar size="lg">` de 84px, el nombre del niño en Fredoka 28px, la meta "N años · Sala {sala}" con la edad derivada de `birth_date` y el botón "Editar" como link muerto `#`.
- [ ] El bloque de alergias es una card blanca con el título "Alergias y notas", una fila de badges con los `allergy_tags` (estilo de la lista: `bg-[#FBD8CC]` / `text-[#D9684A]`) y, debajo, el texto de `medical_notes`.
- [ ] El bloque de alergias no se renderiza cuando el niño no tiene `allergy_tags` ni `medical_notes`.
- [ ] La card de datos muestra "Fecha de nacimiento" (día, mes y año), "Sala" (nombre de la sala) e "Ingreso" (mes y año de `enrolled_at`), con separadores `border-borde-suave`.
- [ ] El CTA "Resumen del día" es un link muerto `#` con fondo `bg-tinta` y texto blanco.
- [ ] El panel "PADRES VINCULADOS" se renderiza con su título y **sin lista de padres**.
- [ ] "Vincular otro padre" aparece como botón deshabilitado con la estética del mockup, no abre ningún modal y no invoca ninguna acción.
- [ ] `components/kids/LinkParentModal.tsx` sigue en el repo y ningún archivo lo importa.
- [ ] `data/kids/profile-types.ts` no existe y `grep -rn "profile-types" app components data hooks` no devuelve resultados.
- [ ] `components/kids/KidNotFound.tsx` se reutiliza sin cambios para un id inexistente: mensaje "Niño no encontrado" y link "Volver a Niños", dentro del shell con sidebar.
- [ ] Mientras carga, se muestra `KidProfileSkeleton` con la forma del perfil (cabecera + bloques), sin datos de mock.
- [ ] Si la consulta falla, se muestra un mensaje de texto ("No se pudo cargar el perfil del niño") dentro del shell, sin botón de reintentar.
- [ ] `app/(app)/kids/[id]/page.tsx` tipa sus props con `PageProps<"/kids/[id]">` y envuelve la resolución de `params` en `<Suspense>` con el skeleton como fallback.
- [ ] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores, y `node scripts/canonical-classes.mjs` no reporta clases no canónicas.
- [ ] No se modificó ningún archivo fuera del alcance de este spec, y no se tocó ningún dato de la base.

## Decisiones

- **Sí:** el perfil se construye sobre `ChildWithRoomRow`, el mismo tipo que usa el listado. Un solo tipo de niños en el repo (SPEC 16): duplicar la forma de la fila para el perfil obliga a mantener dos estructuras que se desincronizan.
- **Sí:** extender `ChildWithRoomRow` con `enrolled_at` y `medical_notes` y ampliar el `select` de la lista, en vez de crear un `ChildProfileRow` aparte. Dos columnas de más en la consulta del listado son barato frente a mantener un segundo tipo de la misma tabla.
- **Sí:** store nuevo `stores/kid-profile-store.ts` (`useKidProfileStore`), con `fetchKid` como dueño de la red. Sigue la convención `stores/<feature>-store.ts` y permite que la UI solo lea estado.
- **Sí:** el fetch se hace en el navegador con `utils/supabase/client.ts`, igual que `stores/kids-store.ts` y `hooks/useRooms.ts`. El aislamiento por guardería lo resuelven las policies de RLS (SPEC 18), no la app.
- **Sí:** la consulta filtra `status = 'active'`, igual que el listado. Un niño archivado se trata como inexistente y cae en `KidNotFound`, cuyo copy ya dice "no existe o fue removido del listado".
- **Sí:** la sección "PADRES VINCULADOS" se renderiza vacía, con el botón "Vincular otro padre" **deshabilitado**. `parent_children` no existe: inventar una lista de padres sería mentir.
- **Sí:** el botón se conserva en la UI (deshabilitado) y `components/kids/LinkParentModal.tsx` se conserva en el repo, sin imports. La vinculación de padres es un spec aparte; este deja el hueco listo sin functionality muerta en el repo.
- **Sí:** el bloque de alergias es un único bloque con los `allergy_tags` como badges arriba y el texto de `medical_notes` abajo, sobre card blanca. El banner rosa del mockup se descarta porque los badges de la lista son del mismo tono y quedaban ilegibles sobre el rosa.
- **Sí:** los badges de alergia reutilizan el estilo de la tarjeta del listado (`bg-[#FBD8CC]` / `text-[#D9684A]`), para que el dato se vea igual en las dos pantallas.
- **Sí:** los tags de alergia se muestran tal cual (`mani`, `peras`), sin traducir. Es la misma decisión de SPEC 16 para la lista.
- **Sí:** estado de error visible solo como mensaje de texto, sin botón de reintentar. El store expone `error` y `fetchKid` para reintentar a futuro; la UI no lo ofrece todavía.
- **Sí:** skeleton con la forma del perfil durante la carga (SPEC 16 usa el mismo patrón con `KidCardSkeleton`).
- **Sí:** la page sigue siendo Server Component y resuelve `params` dentro de `<Suspense>`, con el skeleton como fallback. Con `cacheComponents: true`, `params` es una runtime API y accederla sin frontera de Suspense bloquea el prerender del shell.
- **Sí:** `KidNotFound` se reutiliza tal cual (SPEC 04) en vez de `notFound()` de Next: el 404 genérico cae fuera del layout `(app)` y pierde el shell.
- **No:** `notFound()` de Next para el id inexistente. El 404 genérico queda fuera del `(app)` layout, sin sidebar; se mantiene el estado in-app.
- **No:** seed o modificación de datos para replicar el mockup en la base. Los niños de prueba se quedan como están; la comparación con el mockup es de layout, no de contenido.
- **No:** traducir los tags de alergia al español.
- **No:** avatar con color o inicial por niño. Se mantiene el `Avatar` genérico (SPEC 04).
- **No:** types generados de Supabase.

## Riesgos

| Riesgo                                                                                                                                                       | Mitigación                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Con `cacheComponents: true`, acceder a `params` sin `<Suspense>` rompe el prerender del shell y falla el build.                                              | La page envuelve la resolución de `params` en `<Suspense>` con el skeleton como fallback (paso 8); el build del paso 12 lo detecta. |
| El perfil consulta una fila por id: si el usuario no puede verla por RLS, la consulta devuelve 0 filas y se muestra "Niño no encontrado" en vez de un error. | Es el comportamiento de `maybeSingle()`: sin filas no hay error. Un fallo real de red sí llega a `error` y se muestra el mensaje.   |
| La edad depende de la fecha del dispositivo del cliente.                                                                                                     | Se deriva con `ageFromBirthDate`, la misma función que usa la lista: el dato es coherente entre pantallas.                          |
| Los niños de prueba tienen fechas de nacimiento de adultos ("1994-11-04"), así que la meta puede decir "31 años".                                            | Es el dato real de la base; el formato de la edad no se adapta.                                                                     |
| El store es global: dos perfiles abiertos a la vez (pestañas) comparten estado.                                                                              | `fetchKid` limpia `child` al empezar; en la práctica solo hay un perfil activo por pestaña.                                         |
| `LinkParentModal` queda en el repo sin imports y puede dar la impresión de funcionalidad disponible.                                                         | Se documenta en "Decisiones" y en el propio archivo; el spec de vinculación de padres lo retoma.                                    |

## Qué NO está en este spec

- `parent_children`, `invitations` y la vinculación real de padres.
- Editar niño y el resumen del día (links muertos `#`).
- Traducción de los tags de alergia al español.
- Avatar con color o inicial por niño.
- Seed de niños, policies de RLS nuevas o cualquier cambio de esquema.
- Semántica del `status` (`archived`) más allá del filtro `active`.
- Estados de error con reintento y estado de lista vacía.
- Tipos generados de Supabase.
- Cambios en SPEC 03, 04, 15, 16, 17 y 18.

Cada una de esas, si aterriza, va en su propio spec.
