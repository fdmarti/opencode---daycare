# SPEC 05 — Pantalla de login (`/login`)

> **Estado:** Approved
> **Depende de:** SPEC 01 (shell + sidebar), SPEC 02 (estructura de carpetas)
> **Fecha:** 2026-10-30
> **Objetivo:** Implementar la pantalla `references/pantallas/login.dc.html` en la ruta `/login` como página standalone (sin shell compartido), replicando el mockup con estilos idénticos, solo con el formulario de email y contraseña, sin funcionalidad.

## Alcance

**En:**

- Ruta nueva `app/login/page.tsx` (fuera del route group `(app)`, sin sidebar ni shell; pantalla completa de dos columnas como el mockup).
- Columna izquierda: panel gradiente `#F6A98E → #F2937A → #EC7E62` con logo (icono sol + "OpenDayCare" en Fredoka), headline "El día de cada niño, compartido con su familia.", subtítulo y pie "🌿 Guardería Sala Soles", más los círculos decorativos.
- Columna derecha: título "Iniciar sesión", subtítulo "Ingresá para ver el día de hoy.", etiqueta "EMAIL", input email vacío, etiqueta "CONTRASEÑA", input password vacío con placeholder "••••••••", link "¿Olvidaste tu contraseña?" (link muerto `#`), botón "Iniciar sesión" (link muerto `#`), y pie "¿Te invitó la guardería? Activá tu cuenta" (link muerto `#`).
- Componente `LoginForm` en `components/login/LoginForm.tsx` que encapsula la columna derecha (título, subtítulo, inputs y acciones), manteniendo la página como orquestadora.
- Estilos globales del mockup para inputs (`::placeholder` en `#B6A99B` y `input:focus { outline: none }`) ya presentes en `app/globals.css` desde SPEC 03; no se duplican.

**Fuera del alcance (para specs futuros):**

- Autenticación real / backend / sesión: el botón "Iniciar sesión" es link muerto `#`.
- Ingreso como Personal / Familia: el toggle se elimina por completo de la UI (no se renderiza).
- "¿Olvidaste tu contraseña?" y "Activá tu cuenta": links muertos `#`.
- Formulario funcional (validación, `onSubmit`, estado controlado): los inputs son no controlados y estáticos.
- Redirección post-login al feed.

## Modelo de datos

Esta feature no introduce nuevas estructuras de datos. Reutiliza únicamente estilos y componentes existentes. No hay persistencia.

## Plan de implementación

1. Crear `components/login/LoginForm.tsx`: columna derecha del mockup (título, subtítulo, campos email/password con etiquetas, link "¿Olvidaste tu contraseña?", botón "Iniciar sesión", pie "Activá tu cuenta"), todos los links muertos `#` y los inputs sin valor por defecto. Verificación: el componente compila y renderiza aislado.
2. Crear `app/login/page.tsx`: layout de dos columnas (panel izquierdo gradiente + `<LoginForm/>`), con los círculos decorativos y el logo. Verificación: `/login` renderiza la pantalla completa en `npm run dev`.
3. Correr `npm run lint`, `npx tsc --noEmit` y `npm run build`. Verificación: los tres pasan sin errores.
4. Comparar una captura de Playwright de `/login` (guardada en `.playwright-mcp/`) contra `references/pantallas/login.dc.html` y ajustar deltas de espaciado, color y tipografía hasta coincidir.
5. Fix de clases Tailwind no canónicas (lint `tailwindCSS.lint.suggestCanonicalClasses` de la extensión VS Code) en **todo** el código del proyecto: crear `scripts/canonical-classes.mjs` (usa `canonicalizeCandidates` de `@tailwindcss/node` sobre `app/globals.css`), ejecutarlo con `--fix` y reemplazar cada clase no canónica por su forma canónica (por ejemplo `px-[18px]` → `px-4.5`, `text-[#94887B]` → `text-mute`, `bg-gradient-to-b` → `bg-linear-to-b`). Verificación: el script reporta `0 non-canonical classes` y el render de `/`, `/kids`, `/kids/[id]` y `/login` no cambia (mismas capturas de Playwright).

## Criterios de aceptación

- [x] `npm run build`, `npm run lint` y `npx tsc --noEmit` pasan sin errores.
- [x] `/login` renderiza fuera del shell compartido: no se muestra el sidebar y la página ocupa el viewport completo.
- [x] La columna izquierda muestra el gradiente `#F6A98E → #F2937A → #EC7E62`, el logo (icono sol + "OpenDayCare" en Fredoka 21px), el headline "El día de cada niño, compartido con su familia." en Fredoka 42px, el subtítulo y el pie "🌿 Guardería Sala Soles".
- [x] La columna derecha muestra el título "Iniciar sesión" en Fredoka 30px, el subtítulo "Ingresá para ver el día de hoy." y las etiquetas "EMAIL" y "CONTRASEÑA" en 12px bold `#94887B`.
- [x] Los inputs de email y contraseña están vacíos, con borde `#EADFD0`, fondo `#fff`, padding 14px 16px y border-radius 14px; el de contraseña tiene placeholder "••••••••".
- [x] No se renderiza el toggle "Personal / Familia" ni ningún elemento asociado.
- [x] El botón "Iniciar sesión" tiene el gradiente `#F4977E → #EE8164`, texto blanco 16px bold y sombra `0 10px 22px -8px rgba(238,129,100,.7)`.
- [x] "¿Olvidaste tu contraseña?", "Iniciar sesión" y "Activá tu cuenta" son links muertos `#` que no rompen la app.
- [x] El pie muestra "¿Te invitó la guardería? Activá tu cuenta" con "Activá tu cuenta" en `#C5503A` bold.
- [x] En viewports mobile la grilla pasa a una columna (la columna izquierda se oculta o se apila) sin scroll horizontal.
- [x] La UI vive en `components/login/` y `app/login/page.tsx` solo orquesta; no declara datos ni lógica de negocio.
- [x] Existe una captura de Playwright de `/login` en `.playwright-mcp/` comparada contra el mockup sin deltas visuales.
- [x] `node scripts/canonical-classes.mjs` reporta `0 non-canonical classes`: ninguna clase del proyecto dispara el aviso `suggestCanonicalClasses` de la extensión de Tailwind.

## Decisiones

- **Sí:** ruta `/login` fuera del route group `(app)`, para que la página sea standalone sin sidebar, replicando el mockup completo.
- **No:** autenticación real, sesión ni redirección. El botón es link muerto `#`, consistente con el resto del proyecto sin backend.
- **No:** toggle "Personal / Familia". El usuario decidió ignorarlo; se elimina por completo de la UI para no dejar elementos muertos.
- **Sí:** inputs vacíos sin valor por defecto. Formulario estático, sin estado controlado.
- **Sí:** botón "Iniciar sesión" como link muerto `#` (no `<button>` con `onClick`), mismo criterio que los otros CTAs del proyecto.
- **Sí:** columna izquierda replicada tal cual del mockup (gradiente, logo, headline, subtítulo, pie, círculos decorativos).
- **No:** editar los specs 01–04. Quedan como registro histórico.
- **Sí:** canonicalizar las clases Tailwind de todo el código (no solo de `/login`), por pedido explícito del usuario. Solo se tocan archivos de código: los specs 01–04 no se editan.

## Riesgos

| Riesgo                                                                               | Mitigación                                                                                                              |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `app/login/page.tsx` fuera de `(app)` no hereda el layout global de fuentes/estilos. | Verificar que `app/layout.tsx` (root) provea las fuentes Fredoka/Nunito y `globals.css`; si no, importarlos en la page. |
| Tailwind no genera clases por interpolación.                                         | Las clases de gradiente y colores se escriben como strings literales en el JSX.                                         |

## Qué NO está en este spec

- Autenticación real, sesión y redirección post-login.
- Toggle Personal / Familia.
- Validación de formulario y estado controlado.
- "¿Olvidaste tu contraseña?" y "Activá tu cuenta" funcionales.
- Cambios a los specs 01–04.

Cada una de esas, si aterriza, va en su propio spec.
