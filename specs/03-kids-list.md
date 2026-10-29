# SPEC 03 — Listado de niños (`/kids`)

> **Estado:** Borrador
> **Depende de:** SPEC 01 (shell + sidebar), SPEC 02 (estructura de carpetas)
> **Fecha:** 2026-10-29
> **Objetivo:** Implementar la pantalla `references/pantallas/ninos.dc.html` en la ruta `/kids` dentro de `app/(app)/`, con estilos idénticos al mockup y datos hardcodeados.

## Alcance

**En:**

- Ruta nueva `app/(app)/kids/page.tsx` (dentro del route group `(app)`, reutiliza el shell `Sidebar` + `<main>` sin tocar `app/(app)/layout.tsx`).
- Header de la pantalla: kicker "GESTIÓN", `<h1>` "Niños" y botón "Agregar niño" (gradiente `#F4977E → #EE8164`, link muerto).
- Buscador estático: ítem de lupa + `<input placeholder="Buscar niño…">`, sin `onChange` y sin filtrado.
- Encabezado de sección "SALA SOLES" + contador "8 niños" derivado de `mockKids.length` + línea separadora.
- Grilla de tarjetas: 2 columnas (`sm:grid-cols-2`), 1 columna bajo `sm`, gap 14px, 8 tarjetas del mockup.
- Componente `KidCard` en `components/kids/KidCard.tsx`: avatar con inicial, nombre, meta ("3 años · 2 padres vinculados" / "sin padres vinculados"), badge de alergía o badge "VINCULAR" o chevron, hover con borde `#F2A78E` y `translateY(-2px)`.
- Data mockeada en `data/kids/mock-kids.ts` (tipo `Kid` + `mockKids`), siguiendo la convención `data/<feature>/` del SPEC 02.
- Ajuste en `components/layout/Sidebar.tsx`: el ítem "Niños" pasa a `path: "/kids"` y se renderiza como `<Link>` real para que se marque activo en esa ruta (Avisos y Mi cuenta siguen siendo links muertos).
- Estilos globales del mockup para inputs (`::placeholder` en `#B6A99B` y `input:focus { outline: none }`) agregados a `app/globals.css`.

**Fuera del alcance (para specs futuros):**

- Perfil del niño (`references/pantallas/perfil-nino.dc.html`): las tarjetas quedan como link muerto `#`.
- Alta de niño (`references/pantallas/agregar-nino.dc.html`): el botón "Agregar niño" queda como link muerto `#`.
- Búsqueda funcional (filtrado por nombre) y ordenamiento de la grilla.
- Vinculación de padres (`vincular-padre.dc.html`) y la acción real del badge "VINCULAR".
- Datos reales / backend: la data vive solo en `data/kids/mock-kids.ts`.
- Pantallas Avisos, Mi cuenta y Login: siguen como links muertos.
- Edición de `specs/01-feed-home.md` ni `specs/02-folder-structure.md` (registro histórico).

## Modelo de datos

```ts
// data/kids/mock-kids.ts (screaming architecture: la data es del dominio kids)
// Regla del repo: código en inglés; contenido visible (strings) en español.

export interface Kid {
  id: string;
  name: string; // "Mateo Fernández"
  age: number; // 3 → "3 años"
  linkedParents: number; // 2 → "2 padres vinculados"; 0 → "sin padres vinculados"
  allergy?: string; // "MANÍ" | "LACTOSA"; ausente → sin badge de alergía
  avatarClass: string; // clases Tailwind literales: "bg-[#A9D9E8] text-[#1F7A93]"
}

export const mockKids: Kid[] = [
  /* los 8 niños del mockup: Mateo, Sofía, Benjamín, Valentina, Tomás, Emma, Lucas, Olivia */
];
```

Convenciones:

- La inicial del avatar se deriva de `name[0]` dentro de `KidCard`; no se guarda en la data.
- El badge se resuelve en `KidCard`: `allergy` primero, después `linkedParents === 0` → "VINCULAR", si no chevron.
- `avatarClass` usa valores literales porque Tailwind no genera clases por interpolación de strings.

No hay persistencia: los datos viven solo en este archivo de ejemplo.

## Plan de implementación

1. Crear `data/kids/mock-kids.ts` con el tipo `Kid` y `mockKids` (los 8 niños, con nombre, edad, padres vinculados, alergía y color de avatar copiados del mockup). Verificación: `npx tsc --noEmit` resuelve el archivo.
2. Crear `components/kids/KidCard.tsx`: tarjeta con avatar/inicial, nombre, meta, badge o chevron y el hover del mockup. Verificación: el componente compila y renderiza con un `Kid` de prueba.
3. Agregar a `app/globals.css` las reglas globales del mockup para inputs: `::placeholder { color: #B6A99B }` e `input:focus { outline: none }`. Verificación: `npm run dev` sigue levantando sin errores.
4. Crear `app/(app)/kids/page.tsx`: header ("GESTIÓN" + "Niños" + botón "Agregar niño"), buscador estático, sección "SALA SOLES" con `mockKids.length` y la grilla `grid-cols-1 sm:grid-cols-2 gap-[14px]` mapeando `KidCard`. Verificación: `/kids` renderiza las 8 tarjetas en `npm run dev`.
5. Actualizar `components/layout/Sidebar.tsx`: `path: "/kids"` en el ítem "Niños" y render de `<Link>` para las rutas que existen (Feed y Niños), manteniendo `<a href="#">` para Avisos y Mi cuenta. Verificación: al navegar de `/` a `/kids` el ítem aparece activo y no hay full reload.
6. Correr `npm run lint`, `npx tsc --noEmit` y `npm run build`. Verificación: los tres pasan sin errores.
7. Comparar una captura de Playwright de `/kids` (guardada en `.playwright-mcp/`) contra `references/pantallas/ninos.dc.html` y ajustar deltas de espaciado, color y tipografía hasta coincidir.

## Criterios de aceptación

- [ ] `npm run build`, `npm run lint` y `npx tsc --noEmit` pasan sin errores.
- [ ] `/kids` renderiza dentro del shell compartido: sidebar visible en viewports ≥ `lg` y `<main>` scrolleable; navegar desde `/` no provoca full reload.
- [ ] El header muestra el kicker "GESTIÓN" en `#D9583C`, el `<h1>` "Niños" en Fredoka 30px y el botón "Agregar niño" con gradiente y sombra del mockup.
- [ ] El buscador muestra el ítem de lupa y el placeholder "Buscar niño…" con color `#B6A99B`; no tiene `onChange` ni filtrado.
- [ ] La sección muestra "SALA SOLES", el contador "8 niños" derivado de `mockKids.length` y el separador `#E7DAC8`.
- [ ] La grilla tiene 2 columnas en viewports ≥ `sm`, 1 columna por debajo y gap de 14px.
- [ ] Se renderizan exactamente las 8 tarjetas del mockup con nombre, meta ("3 años · 2 padres vinculados" o "2 años · sin padres vinculados") y avatar de 48px con la inicial.
- [ ] Mateo muestra el badge "MANÍ" y Tomás el badge "LACTOSA" en fondo `#FBD8CC` / texto `#D9684A`.
- [ ] Valentina muestra el badge "VINCULAR" en fondo `#F9D2DE` / texto `#C56486` y el texto "sin padres vinculados".
- [ ] Sofía, Benjamín, Emma, Lucas y Olivia muestran el chevron `›` en `#CBB89F`, sin badge.
- [ ] Al pasar el mouse sobre una tarjeta el borde cambia a `#F2A78E` y la tarjeta se desplaza 2px hacia arriba en 150ms.
- [ ] El ítem "Niños" del sidebar aparece activo en `/kids` (fondo `#FBE3D8`, texto `#D9583C`, peso 800) y navega con `<Link>`; Avisos y Mi cuenta siguen como links muertos que no rompen la app.
- [ ] "Agregar niño" y las tarjetas son links muertos `#` que no rompen la app.
- [ ] En viewports < `lg` la sidebar no se muestra y la grilla ocupa el ancho completo sin scroll horizontal.
- [ ] La data vive en `data/kids/mock-kids.ts` y la UI en `components/kids/`; `app/(app)/kids/page.tsx` solo orquesta y no declara datos.

## Decisiones

- **Sí:** ruta `/kids` (decisión explícita del usuario), aunque el SPEC 01 haya registrado `/ninos` y el resto de las rutas sean en español. Este spec reemplaza el path registrado en el Sidebar.
- **No:** búsqueda funcional. El input es estático, mismo criterio que los contadores del SPEC 01: sin backend la interactividad sería UI falsa.
- **No:** rutas reales para perfil (`/kids/[id]`) ni alta (`/kids/nuevo`). Ambas pantallas merecen su propio spec; por ahora links muertos `#`.
- **Sí:** data en `data/kids/mock-kids.ts` con tipo `Kid`, siguiendo la convención `data/<feature>/` del SPEC 02. El contador "8 niños" se deriva de `length` para no duplicar el número.
- **Sí:** colores de avatar como clases Tailwind literales en la data (`avatarClass`). Tailwind no compila clases construidas por concatenación.
- **Sí:** inicial derivada de `name[0]` en `KidCard`. Un solo lugar para la lógica; la data no guarda datos derivados.
- **Sí:** carpeta de feature `components/kids/`, alineada con la ruta `/kids` elegida.
- **Sí:** prioridad de badge `allergy` > `linkedParents === 0` > chevron. El mockup no tiene un caso con ambos; se fija la regla para que no quede a criterio del implementador.
- **Sí:** `::placeholder` y `input:focus { outline: none }` en `app/globals.css`, replicando el `<style>` global del mockup. Aplica a todos los inputs futuros (login, agregar niño).
- **No:** focus ring accesible en el input. El mockup lo elimina explícitamente; se replica tal cual.
- **Sí:** grilla `grid-cols-1 sm:grid-cols-2`. El mockup solo define desktop; en mobile las tarjetas ocupan el ancho completo.
- **No:** editar los SPEC 01 y 02. Quedan como registro histórico; la decisión `/ninos` del 01 queda superada por la de este spec.

## Riesgos

| Riesgo                                                                        | Mitigación                                                                                                    |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| El SPEC 01 registra `/ninos`; un lector futuro puede asumir esa ruta.         | Este spec deja constancia de la decisión `/kids` y el Sidebar queda apuntando a la ruta real.                 |
| `LayoutProps<"/">` en `app/(app)/layout.tsx` podría no cubrir la ruta nueva.  | `npx tsc --noEmit` en el paso 6; si el tipado falla, ajustar la firma del layout según la doc de Next 16.4.3. |
| Tailwind no genera `bg-[#A9D9E8]` si la clase se construye por concatenación. | `avatarClass` contiene el string literal completo en `data/kids/mock-kids.ts`.                                |

## Qué NO está en este spec

- Perfil del niño, alta de niño y vinculación de padres.
- Búsqueda funcional y datos reales / backend.
- Pantallas Avisos, Mi cuenta y Login.
- Cambios a los specs 01 y 02.

Cada una de esas, si aterriza, va en su propio spec.
