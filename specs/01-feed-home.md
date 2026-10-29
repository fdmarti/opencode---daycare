# SPEC 01 — Feed en el home (`/`)

> **Estado:** Aprovado
> **Depende de:** ninguna
> **Fecha:** 2026-10-29
> **Objetivo:** Implementar la pantalla `references/pantallas/feed.dc.html` en la ruta `/` con estilos idénticos al mockup, usando Tailwind v4 y datos hardcodeados de ejemplo.

## Alcance

**En:**

- Renderear el feed en `app/page.tsx` (ruta `/`), reemplazando el starter de create-next-app.
- Sidebar fija (logo, botón "Nueva publicación", nav con 4 ítems con Feed activo, bloque de usuario con logout muerto).
- Header de bienvenida ("GUARDERÍA · SALA SOLES", "Buenas, Caro", "12 niños · martes 17 jun"), composer y lista de "Publicado hoy".
- Shell compartido por route group `app/(app)/layout.tsx`: `<Sidebar/>` + `<main>` scrolleable, reutilizable por todas las vistas futuras (Niños, Avisos, etc.) sin duplicarlo.
- `Sidebar` en `features/layout/` como client component con `usePathname()` para marcar el ítem activo según la ruta actual (Feed activo en `/`; Niños activará en `/ninos` sin tocar el sidebar).
- Componente `Post` tipado, renderizado desde un array de mock data (post logro, post actividad con placeholder de foto, post anuncio) idénticos a los del mockup.
- Estilos convertidos de inline a clases Tailwind v4; fuentes Fredoka + Nunito cargadas vía Google Fonts; tokens de color en `@theme` de `app/globals.css`.
- Ajuste mínimo en mobile: la sidebar se oculta con `hidden lg:flex` (queda solo la columna principal).

**Fuera del alcance (para specs futuras):**

- Autenticación y logout funcional.
- Base de datos / backend de publicaciones.
- Crear, editar y ver detalle de publicaciones (rutas `crear-publicacion`, `detalle-publicacion`).
- Pantallas Niños, Avisos, Mi cuenta, Login y visor de fotos: quedan como links muertos.
- Interactividad: contadores de corazones/comentarios son estáticos, sin onClick.
- Navegación mobile real (hamburguesa o barra inferior).

## Modelo de datos

```ts
// features/feed/mock-data.ts (screaming architecture: el mock data es del dominio feed)
// Regla del repo: código en inglés; contenido visible (strings) en español.

export type PostType = "achievement" | "activity" | "announcement";

export interface Post {
  id: string;
  type: PostType;
  childName: string; // nombre del niño para el avatar con inicial; en anuncios es "Anuncio general"
  time: string; // "14:20"
  publishedBy: string; // texto visible: "publicado por vos"
  recipient: string; // texto visible: "familia de Mateo" | "toda la sala"
  text: string; // contenido del post, copia textual del mockup (español)
  photoCaption?: string; // solo type "activity": "Foto · pintando con témperas"
  hearts: number;
  comments: number;
}

export const mockPosts: Post[] = [
  /* los 3 posts del mockup */
];
```

No hay persistencia: los datos viven solo en este archivo de ejemplo.

## Plan de implementación

1. Cargar Fredoka y Nunito (Google Fonts) en `app/layout.tsx` y definir los tokens de color/texto del mockup (ej. `--color-fondo: #F6ECDF`, `--color-card: #FFFDF9`, `--color-borde: #ECE0D0`, `--color-tinta: #3F362E`, acentos `#D9583C`, `#F2937A`, etc.) en `@theme` de `app/globals.css`; mover el reset mínimo (scrollbar, `-webkit-font-smoothing`) a `globals.css`. Verificación: `npm run dev` levanta sin errores.
2. Crear `features/feed/mock-data.ts` con el tipo `Post` y `mockPosts` con los 3 posts del mockup (código en inglés, strings del copy en español).
3. Crear `features/layout/sidebar.tsx` (client component con `usePathname()`; ítem activo = el que matchea la ruta; links a otras pantallas como `<a href="#">`), `features/feed/composer.tsx` y `features/feed/post.tsx` con el markup convertido a Tailwind. Verificación: los componentes compilan y renderizan standalone.
4. Crear `app/(app)/layout.tsx` (flex + `<main>` scrolleable con `min-width:0`) y mover el contenido del feed a `app/(app)/page.tsx`: solo header de bienvenida, `Composer` y la lista de `Post` mapeada desde `mockPosts`. Eliminar `app/page.tsx`. Verificación: `/` renderiza el feed completo; `npm run lint` sin errores.
5. Comparar captura de Playwright de `/` contra el mockup (dentro de `.playwright-mcp/`) y ajustar deltas de espaciado/color/tipografía hasta coincidir.

## Criterios de aceptación

- [x] `/` renderiza sin errores (`npm run build` pasa).
- [x] Fredoka y Nunito cargan correctamente (no hay fallback del sistema en headings ni body).
- [x] La sidebar es idéntica al mockup: logo OpenDayCare/Sala Soles, botón "Nueva publicación" con gradiente y sombra, nav con Feed activo (fondo `#FBE3D8`, texto `#D9583C`) y Niños/Avisos/Mi cuenta inactivos, bloque de usuario "Caro Giménez" con avatar "C".
- [x] El header dice "GUARDERÍA · SALA SOLES", "Buenas, Caro" y "12 niños · martes 17 jun".
- [x] El composer muestra avatar "C", placeholder "Compartí un momento…" y botón de cámara.
- [x] Se muestran exactamente 3 posts bajo "PUBLICADO HOY" con sus badges: LOGRO (verde), ACTIVIDAD (celeste, con placeholder de foto dashed), ANUNCIO (azul, teaser de megáfono en avatar).
- [x] Cada post muestra hora, "publicado por vos", destinatario, texto, corazones, comentarios y "Editar" — con los números del mockup (3/1, 5/2, 8/0).
- [x] Los links a crear-publicacion, detalle-publicacion, ninos, avisos, mi-cuenta, login y foto no rompen la app (no son rutas reales).
- [x] En viewport < lg la sidebar no se muestra y el contenido ocupa el ancho completo.
- [x] El shell (sidebar + `<main>`) vive en `app/(app)/layout.tsx`, no en el page del feed; al navegar a una ruta futura dentro de `(app)` el sidebar persiste sin full reload.
- [x] `Sidebar` marca activo el ítem cuya ruta coincide con `usePathname()` (`/` → Feed).
- [x] Todo componente reutilizable vive bajo `features/` (screaming architecture); no hay UI transversal dentro del page.

## Decisiones

- **Sí:** Tailwind v4 en vez de estilos inline verbatim. Es el patrón del proyecto y el styling es CSS-first (`@theme`).
- **Sí:** tokens de color del mockup en `@theme` de `globals.css` (y no repetidos inline por componente). Un solo lugar para cambiar la paleta.
- **Sí:** mock data tipado en `features/feed/mock-data.ts` (no HTML estático literal). Prepara la migración a datos reales sin tocar el markup.
- **Sí:** route group `app/(app)/layout.tsx` para el shell compartido. Es el patrón de Next 16.4.3 para layouts por sección sin full page reload (doc: `route-groups.md`).
- **Sí:** arquitectura screaming (`features/layout/`, `features/feed/`). "Dónde está cada uno" se lee desde la carpeta, no del nombre del archivo.
- **Sí:** `Sidebar` client component con `usePathname()`. Poco código y hace real la reutilización del ítem activo.
- **Sí:** código en inglés (`Post`, `mockPosts`, `hearts`) y contenido visible en español (regla "Code rules" del AGENTS.md). La app se habla en español; el código no.
- **No:** `lib/mock-data.ts`. El mock data es propiedad del dominio feed → `features/feed/mock-data.ts`.
- **Sí:** un componente `Post` reutilizable para los 3 tipos. Los tipos comparten gran parte del layout; solo cambia badge, avatar y foto.
- **No:** stubs de páginas para Niños/Avisos/etc. Cada pantalla merece su propio spec.
- **No:** interactividad en contadores. Sin backend es UI falsa superficial; se agrega cuando lleguen datos.

## Qué NO está en este spec

- Autenticación, logout funcional y páginas Niños/Avisos/Mi cuenta/Login/Detalle/Crear publicación.
- Persistencia de publicaciones y fotos reales.
- Contadores interactivos y navegación mobile.

Cada una de esas, si aterriza, va en su propio spec.
