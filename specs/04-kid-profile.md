# SPEC 04 — Perfil del niño (`/kids/[id]`)

> **Estado:** Approved
> **Depende de:** SPEC 01 (shell + sidebar), SPEC 02 (estructura de carpetas), SPEC 03 (listado de niños, tipo `Kid` y `mockKids`)
> **Fecha:** 2026-10-29
> **Objetivo:** Implementar la vista detallada del perfil de cada niño en `/kids/[id]`, replicando `references/pantallas/perfil-nino.dc.html` con datos mockeados, y enlazar las tarjetas del listado a esta vista.

## Alcance

**En:**

- Ruta nueva `app/(app)/kids/[id]/page.tsx` (route group `(app)`, reutiliza el shell sin tocar `app/(app)/layout.tsx`). Busca el niño por `id` en `mockKids`; si no existe, renderiza el estado "Niño no encontrado".
- `generateStaticParams` con los 8 ids de `mockKids` para pre-renderizar los perfiles.
- Componente `Avatar` en `components/common/avatars/Avatar.tsx`: avatar genérico único — círculo gris `#ECE0D0` con icono de usuario `#A89A8B` (mismo trazo que `CuentaIcon`), con tres tamaños literales: `md` 48px (lista), `lg` 84px (cabecera del perfil) y `sm` 40px (padres). Sin iniciales ni colores por niño.
- Componente `KidProfile` en `components/kids/KidProfile.tsx`: link "Volver a Niños" a `/kids`, cabecera (avatar `lg`, nombre, meta "3 años · Sala Soles", botón "Editar" como link muerto `#`), banner "Alergias y notas", card de datos (Fecha de nacimiento / Sala / Ingreso), CTA "Resumen del día" (link muerto `#`) y panel "PADRES VINCULADOS" con lista (`Avatar` `sm`) y "Vincular otro padre" (link muerto `#`).
- Componente `KidNotFound` en `components/kids/KidNotFound.tsx`: mensaje "Niño no encontrado" + link "Volver a Niños" a `/kids`, renderizado dentro del shell.
- Data extendida en `data/kids/mock-kids.ts`: nuevos campos en `Kid` (`room`, `birthDate`, `admissionDate`, `allergyNotes`, `parents`), nueva interfaz `KidParent`, y eliminación de `avatarClass` (en `Kid` y `KidParent`) y `linkedParents` (se deriva de `parents.length`).
- Cambio en `components/kids/KidCard.tsx`: el `<a href="#">` pasa a `<Link href={`/kids/${kid.id}`}>`; el avatar usa `<Avatar size="md">`; la meta y el badge "VINCULAR" derivan de `kid.parents.length`.
- Helpers locales de formato de fecha (sin librerías) dentro de `KidProfile.tsx`: `YYYY-MM-DD` → "12 mar 2022" y `YYYY-MM-DD` → "feb 2025".

**Fuera del alcance (para specs futuros):**

- Editar niño (`agregar-nino.dc.html`): el botón "Editar" queda como link muerto `#`.
- Resumen del día (`resumen-dia.dc.html`): el CTA queda como link muerto `#`.
- Vinculación de padres (`vincular-padre.dc.html`): "Vincular otro padre" queda como link muerto `#`.
- Búsqueda funcional del listado y alta de niños.
- Datos reales / backend: la data vive solo en `data/kids/mock-kids.ts`.
- Cambios a los specs 01, 02 y 03 (registro histórico).

## Modelo de datos

```ts
// data/kids/mock-kids.ts (screaming architecture: la data es del dominio kids)
// Regla del repo: código en inglés; contenido visible (strings) en español.

export interface KidParent {
  id: string;
  name: string; // "Lucía Fernández"
  role: "Mamá" | "Papá";
  status: "active" | "pending"; // active → badge ACTIVA; pending → badge PENDIENTE
}

export interface Kid {
  id: string;
  name: string; // "Mateo Fernández"
  age: number; // 3 → "3 años"
  room: string; // "Soles" → cabecera "Sala Soles" y fila "Sala"
  birthDate: string; // "2022-03-12" (YYYY-MM-DD) → "12 mar 2022"
  admissionDate: string; // "2025-02-01" (YYYY-MM-DD) → "feb 2025" (display solo mes y año)
  allergy?: string; // "MANÍ" | "LACTOSA"; badge corto en la lista del SPEC 03
  allergyNotes?: string; // párrafo del banner "Alergias y notas"; ausente → sin banner
  parents: KidParent[]; // 0 padres → sección solo con el botón "Vincular otro padre"
}
```

Convenciones:

- Se eliminan `Kid.avatarClass` y `KidParent.avatarClass`: el avatar es siempre el mismo (`Avatar` gris con icono de usuario).
- `linkedParents` se elimina: la meta de la tarjeta, el badge "VINCULAR" y el panel de padres derivan de `parents.length`.
- El subtítulo del padre se deriva: `${role} · ${label}`, con `label` = "invitación enviada" si `status === "pending"`, si no "activa" para `role === "Mamá"` y "activo" para `role === "Papá"`. El badge es fijo: "ACTIVA" (fondo `#CFEBD8`, texto `#3E9B6C`) o "PENDIENTE" (fondo `#F7E7A6`, texto `#9A7B1E`).
- Las fechas se guardan en `YYYY-MM-DD`. `admissionDate` usa el primer día del mes; el display ignora el día.
- Solo Mateo tiene mockup de perfil. Los otros 7 niños se cargan con datos plausibles: Valentina con `parents: []`, Tomás con `allergy: "LACTOSA"` y `allergyNotes`, el resto con padres activos.

No hay persistencia: los datos viven solo en este archivo de ejemplo.

## Plan de implementación

1. Extender `data/kids/mock-kids.ts` de forma aditiva: interfaz `KidParent`, campos `room`, `birthDate`, `admissionDate`, `allergyNotes` y `parents` en los 8 niños (Mateo con Lucía "active" y Diego "pending" del mockup), manteniendo todavía `avatarClass` y `linkedParents`. Verificación: `npx tsc --noEmit` pasa y `/kids` se ve igual.
2. Crear `components/common/avatars/Avatar.tsx`: círculo `bg-[#ECE0D0] text-[#A89A8B]`, icono SVG inline (trazo de `CuentaIcon`) y mapa de tamaños con clases literales (`md` 48px, `lg` 84px, `sm` 40px; icono proporcional). Verificación: compila con los tres tamaños.
3. Crear `app/(app)/kids/[id]/page.tsx` con `params` resuelto como Promise (Next 16) y `generateStaticParams`, más el componente `components/kids/KidNotFound.tsx`. La page busca el niño y renderiza `KidNotFound` si no existe. Verificación: `/kids/kid-mateo` renderiza el shell con el nombre; `/kids/xyz` muestra "Niño no encontrado".
4. Crear `components/kids/KidProfile.tsx` completa: columna izquierda (link "Volver a Niños", cabecera con `<Avatar size="lg">`, meta `${age} años · Sala ${room}`, botón "Editar" `#`, banner "Alergias y notas" condicionado a `allergyNotes`, card de datos con los helpers de fecha) y columna derecha (CTA "Resumen del día" `#`, panel "PADRES VINCULADOS" con `<Avatar size="sm">`, badges y "Vincular otro padre" `#`, visible siempre). Verificación: Mateo muestra 2 padres con sus badges; `/kids/kid-valentina` muestra solo el botón.
5. Actualizar `components/kids/KidCard.tsx`: `<Link href={`/kids/${kid.id}`}>`, `<Avatar size="md">` y derivación de `parents.length` (meta y badge "VINCULAR"); eliminar `avatarClass` e `linkedParents` de `data/kids/mock-kids.ts`. Verificación: en `/kids` las 8 tarjetas navegan sin full reload y el texto de meta no cambió.
6. Correr `npm run lint`, `npx tsc --noEmit` y `npm run build`. Verificación: los tres pasan sin errores.
7. Comparar una captura de Playwright de `/kids/kid-mateo` (guardada en `.playwright-mcp/`) contra `references/pantallas/perfil-nino.dc.html` y ajustar deltas de espaciado, color y tipografía hasta coincidir.

## Criterios de aceptación

- [x] `npm run build`, `npm run lint` y `npx tsc --noEmit` pasan sin errores.
- [x] `/kids/kid-mateo` renderiza dentro del shell compartido: sidebar visible en viewports ≥ `lg` y `<main>` scrolleable; navegar desde `/kids` no provoca full reload.
- [x] El link "Volver a Niños" navega a `/kids` con `<Link>` (chevron izquierdo, color `#94887B`, font-weight 700).
- [x] La cabecera muestra `<Avatar size="lg">` de 84px (`#ECE0D0` + icono `#A89A8B`), `<h1>` "Mateo Fernández" en Fredoka 28px, meta "3 años · Sala Soles" y botón "Editar" con borde `#ECE0D0` como link muerto `#`.
- [x] El banner "Alergias y notas" se renderiza solo cuando `allergyNotes` existe, con fondo `#FBDAD6`, icono de alerta, título `#C5413A` y párrafo `#B25249`.
- [x] Mateo y Tomás muestran el banner; Sofía, Benjamín, Valentina, Emma, Lucas y Olivia no.
- [x] La card de datos muestra "Fecha de nacimiento" → "12 mar 2022", "Sala" → "Soles" e "Ingreso" → "feb 2025", en filas con separadores `#F0E6D8`.
- [x] El CTA "Resumen del día" tiene fondo `#3F362E`, texto blanco y es link muerto `#`.
- [x] "PADRES VINCULADOS" lista cada padre con `<Avatar size="sm">` de 40px, subtítulo derivado ("Mamá · activa", "Papá · invitación enviada") y badge "ACTIVA" (`#CFEBD8`/`#3E9B6C`) o "PENDIENTE" (`#F7E7A6`/`#9A7B1E`).
- [x] Mateo muestra a Lucía Fernández (ACTIVA) y Diego Fernández (PENDIENTE) exactamente como el mockup.
- [x] "Vincular otro padre" aparece siempre, incluido con 0 padres, como link muerto `#` con el círculo punteado.
- [x] `/kids/kid-valentina` muestra la sección de padres solo con el botón "Vincular otro padre", sin texto adicional.
- [x] `/kids/id-inexistente` muestra el estado in-app "Niño no encontrado" con link "Volver a Niños", dentro del shell (con sidebar).
- [x] En `/kids` cada tarjeta navega a `/kids/[id]` con `<Link>` (sin full reload), muestra `<Avatar size="md">` de 48px genérico (sin inicial ni color por niño) y el badge "VINCULAR" de Valentina se mantiene, derivando de `parents.length === 0`.
- [x] `Kid` y `KidParent` no tienen `avatarClass`; `Kid` no tiene `linkedParents`. La meta de la tarjeta muestra el mismo texto que antes ("3 años · 2 padres vinculados" / "2 años · sin padres vinculados").
- [x] En viewports < `lg` la sidebar no se muestra, el layout se apila por `flex-wrap` y no hay scroll horizontal.
- [x] La data vive en `data/kids/mock-kids.ts`, el `Avatar` genérico en `components/common/avatars/` y el resto de la UI en `components/kids/`; `app/(app)/kids/[id]/page.tsx` solo orquesta y no declara datos.
- [x] Existe una captura de Playwright de `/kids/kid-mateo` en `.playwright-mcp/` comparada contra el mockup sin deltas visuales.

## Decisiones

- **Sí:** wirear `KidCard` con `<Link>` a `/kids/[id]`. Sin esto la vista nueva sería inalcanzable desde la UI; el SPEC 03 dejó el perfil explícitamente para otro spec (este).
- **Sí:** "Editar", "Resumen del día" y "Vincular otro padre" como links muertos `#`. Réplica del markup; cada pantalla destino (agregar-nino, resumen-dia, vincular-padre) va en su propio spec.
- **Sí:** extender `Kid` + `KidParent` en `data/kids/mock-kids.ts`. Fuente única; un archivo separado de detalles podría desincronizarse del listado.
- **Sí:** eliminar `linkedParents` y derivar de `parents.length`. Una sola fuente de verdad; el cambio en `KidCard` es mínimo y el comportamiento idéntico.
- **Sí:** avatar genérico único (fondo `#ECE0D0`, icono `#A89A8B`) en las tres ubicaciones (lista 48px, perfil 84px, padres 40px). Decisión explícita del usuario: elimina los colores por niño del mockup.
- **No:** avatares de colores con inicial (como el mockup). Descartado por el usuario: se busca uniformidad genérica.
- **Sí:** `Avatar` en `components/common/avatars/` (transversal, convención SPEC 02), no en `components/kids/`.
- **Sí:** el icono va como SVG inline dentro de `Avatar` (trazo de `CuentaIcon`) en vez de reutilizar `CuentaIcon`, que tiene tamaño fijo 19px y quedaría pequeño en 84px.
- **Sí:** fechas en `YYYY-MM-DD` en la data (`birthDate`, `admissionDate`), formato al español en helpers locales de `KidProfile.tsx`. El día de `admissionDate` se ignora en el display ("feb 2025").
- **No:** librería de fechas (date-fns, etc.). Dos formatos fijos no justifican la dependencia.
- **No:** `notFound()` de Next. El 404 genérico queda fuera del `(app)` layout, sin sidebar; se eligió el estado in-app dentro del shell.
- **No:** texto "Sin padres vinculados" con 0 padres. El mockup no lo define; solo se muestra el botón.
- **Sí:** banner "Alergias y notas" condicionado a `allergyNotes?`, independiente del badge `allergy` de la lista. Son dos presentaciones distintas del dato.
- **Sí:** subtítulo del padre derivado de rol + estado ("Mamá · activa", "Papá · activo", "· invitación enviada"). El badge es fijo sin género (ACTIVA/PENDIENTE).
- **Sí:** `room: string` en `Kid` con valor "Soles" para los 8. El mockup lo muestra en dos lugares y la sala es un dato del niño, no una constante global.
- **Sí:** data plausibles inventada para los 7 niños sin mockup (consistente con la lista: Valentina 0 padres, Tomás con LACTOSA).
- **No:** editar los specs 01–03. La exclusión "perfil del niño" del SPEC 03 queda cubierta por este spec; el registro histórico se mantiene intacto.

## Riesgos

| Riesgo                                                                                                                                    | Mitigación                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Next 16.4.3 con `cacheComponents: true`: la firma de `params` (Promise) y `generateStaticParams` puede diferir de datos de entrenamiento. | Leer `node_modules/next/dist/docs/` antes de escribir la page (paso 3); `npx tsc --noEmit` verifica la firma.     |
| Tailwind no genera clases construidas por interpolación.                                                                                  | `Avatar` define sus clases de tamaño como literales en un mapa (`sizeClasses`).                                   |
| Ruta futura `/kids/nuevo` (alta de niño) chocaría con `[id]`.                                                                             | Next da prioridad a segmentos estáticos sobre dinámicos; queda registrado para el spec de alta.                   |
| 7 de 8 perfiles no tienen mockup.                                                                                                         | Datos plausibles y consistentes con la lista del SPEC 03; cualquier cambio de copy es solo editar `mock-kids.ts`. |

## Qué NO está en este spec

- Editar niño, resumen del día y vinculación de padres (links muertos `#`, cada una en su propio spec).
- Búsqueda funcional y alta de niños.
- Datos reales / backend / persistencia.
- Cambios a los specs 01, 02 y 03.

Cada una de esas, si aterriza, va en su propio spec.
