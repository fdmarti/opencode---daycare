# SPEC 06 — Vista de activación de cuenta (`/register`)

> **Estado:** Approved
> **Depende de:** SPEC 05 (pantalla de login), SPEC 02 (estructura de carpetas)
> **Fecha:** 2026-10-30
> **Objetivo:** Implementar la vista `references/pantallas/activar-cuenta.dc.html` en la ruta `/register` como página standalone con datos mock, accesible desde el link "Activá tu cuenta" de `/login`.

## Alcance

**En:**

- Ruta nueva `app/register/page.tsx`, fuera del route group `(app)` (sin shell ni sidebar), con fondo `#FBF4EC`, contenedor centrado de 440px máximo.
- Encabezado: cuadro de 58px con gradiente `#F8C3A8 → #F2937A`, radio 18px, sombra `0 12px 26px -10px rgba(238,129,100,.65)`, con el `SunIcon` de `components/common/icons/Icons.tsx` a `size={30}`.
- Título "Bienvenida a OpenDayCare" en Fredoka 32px semibold y subtítulo "Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar la cuenta."
- Tarjeta de invitación: avatar circular "M" (`#A9D9E8` / `#1F7A93`), rótulo "Te invitaron a seguir a" y "Mateo · Sala Soles" en Fredoka 17px.
- Tres campos con etiquetas "CÓDIGO DE INVITACIÓN", "EMAIL" y "CREAR CONTRASEÑA", prellenados con los valores del mockup.
- Casilla de consentimiento de fotos: `input[type=checkbox]` real, marcado, con `accent-color #5FB97E`, dentro de la caja `#FBF1D6` con texto `#8A7234`.
- Botón "Activar mi cuenta" con el gradiente `#F4977E → #EE8164`, link muerto `#`.
- Pie "¿Ya tenés cuenta? **Iniciar sesión**" con `Link` de `next/link` hacia `/login`.
- `components/register/RegisterForm.tsx` que encapsula todo el formulario.
- `data/register/mock-invite.ts` con los datos mock (código, email, contraseña, niño, sala).
- Prop opcional `size` en todos los iconos de `components/common/icons/Icons.tsx`, con default 20, y actualización de cada call site para pasar su tamaño original.
- El link "Activá tu cuenta" del pie de `/login` pasa a apuntar a `/register` con `Link` de `next/link`.

**Fuera del alcance (para specs futuros):**

- Activación real de la cuenta: el botón "Activar mi cuenta" es link muerto `#`.
- Validación de formulario, estado controlado, `onChange` o mensajes de error.
- Persistencia de la contraseña o del código de invitación.
- Redirección post-activación al feed.
- Modificar `specs/app/05-login.md` u otros specs previos: quedan como registro histórico.

## Modelo de datos

```ts
// data/register/mock-invite.ts
export interface InviteMock {
  /** Visible copy: "Mateo" */
  childName: string;
  /** Visible copy: "Sala Soles" */
  classroomName: string;
  /** Mock invite code shown in the form, e.g. "7K4P9" */
  inviteCode: string;
  /** Mock email shown in the form */
  email: string;
  /** Mock password shown in the form */
  password: string;
}

export const mockInvite: InviteMock = {
  childName: "Mateo",
  classroomName: "Sala Soles",
  inviteCode: "7K4P9",
  email: "lucia.fernandez@gmail.com",
  password: "contraseña",
};
```

Convención: código en inglés, copy visible en español. Sin persistencia.

## Plan de implementación

1. Agregar a **todos** los iconos de `components/common/icons/Icons.tsx` la prop opcional `size?: number`, con **default 20**, aplicando `width={size} height={size}`. Verificación: `npx tsc --noEmit` pasa.
2. Actualizar los call sites para pasar explícitamente el tamaño con el que fue diseñado originalmente:

   | Archivo                                                             | Uso                                                 | `size` |
   | ------------------------------------------------------------------- | --------------------------------------------------- | ------ |
   | `components/layout/Sidebar.tsx`                                     | `SunIcon`                                           | 21     |
   |                                                                     | `PlusIcon`                                          | 17     |
   |                                                                     | `FeedIcon`, `NinosIcon`, `AvisosIcon`, `CuentaIcon` | 19     |
   |                                                                     | `LogoutIcon`                                        | 16     |
   | `components/login/LoginPanel.tsx`                                   | `SunIcon`                                           | 21     |
   | `components/feed/Post.tsx`                                          | `MegaphoneIcon`                                     | 20     |
   |                                                                     | `ImagePlaceholderIcon`                              | 30     |
   |                                                                     | `HeartIcon`                                         | 19     |
   |                                                                     | `CommentIcon`                                       | 18     |
   | `components/feed/Composer.tsx`                                      | `CameraIcon`                                        | 19     |
   | `components/kids/KidCard.tsx`                                       | `ChevronIconRight`                                  | 18     |
   | `components/kids/KidNotFound.tsx`, `components/kids/KidProfile.tsx` | `ChevronIconLeft`                                   | 18     |

   Verificación: `/`, `/kids`, `/kids/[id]` y `/login` renderizan los íconos con exactamente los mismos tamaños que antes del refactor.

3. Crear `data/register/mock-invite.ts` con `InviteMock` y `mockInvite`. Verificación: compila y exporta ambos símbolos.
4. Crear `components/register/RegisterForm.tsx`: badge con `<SunIcon size={30} />`, título, subtítulo, tarjeta de invitación, los tres campos con `defaultValue` desde `mockInvite`, la casilla de consentimiento marcada, el botón "Activar mi cuenta" (`href="#"`) y el pie con `Link href="/login"`. Verificación: el componente renderiza aislado sin errores.
5. Crear `app/register/page.tsx`: contenedor `min-h-screen` con `bg-[#FBF4EC]`, centrado, `max-w-[440px]`, padding 40px, que monta `<RegisterForm />`. Verificación: `/register` renderiza la pantalla completa en `npm run dev`, sin sidebar.
6. Actualizar `components/login/LoginForm.tsx`: el link "Activá tu cuenta" pasa de `href="#"` a `Link href="/register"`. Verificación: desde `/login`, el link lleva a `/register` y el resto de la pantalla no cambia.
7. Correr `npm run lint`, `npx tsc --noEmit` y `npm run build`. Verificación: los tres pasan sin errores.

## Criterios de aceptación

- [x] `npm run build`, `npm run lint` y `npx tsc --noEmit` pasan sin errores.
- [x] `/register` renderiza fuera del shell compartido: sin sidebar, ocupa el viewport completo con fondo `#FBF4EC`.
- [x] El encabezado muestra el cuadro de 58px con gradiente `#F8C3A8 → #F2937A` y el ícono de sol a 30px.
- [x] El título "Bienvenida a OpenDayCare" se muestra en Fredoka 32px semibold `#3F362E`, con el subtítulo en `#94887B` 15.5px.
- [x] La tarjeta de invitación muestra el avatar circular "M" con fondo `#A9D9E8` y texto `#1F7A93`, "Te invitaron a seguir a" y "Mateo · Sala Soles" en Fredoka 17px.
- [x] Los tres campos existen con sus etiquetas en 12px bold `#94887B` y traen los valores del mockup: "7K4P9", "lucia.fernandez@gmail.com" y una contraseña enmascarada.
- [x] El campo de código usa `font-display`, 18px, `letter-spacing: 3px` y `font-weight: 700`.
- [x] El campo de contraseña tiene borde `#F2A78E`.
- [x] La casilla de consentimiento es un `input[type=checkbox]` real, marcado, dentro de la caja `#FBF1D6` con el texto "Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app." en `#8A7234` 14px.
- [x] El botón "Activar mi cuenta" tiene el gradiente `#F4977E → #EE8164`, texto blanco 16px bold y sombra `0 10px 22px -8px rgba(238,129,100,.7)`; es un link muerto `#` que no navega ni rompe la app.
- [x] El pie muestra "¿Ya tenés cuenta?" con "Iniciar sesión" en `#C5503A` bold, y al clickearlo navega a `/login`.
- [x] En `/login`, el link "Activá tu cuenta" del pie navega a `/register`.
- [x] Los datos del formulario provienen de `data/register/mock-invite.ts`, no están hardcodeados en el componente.
- [x] La UI vive en `components/register/` y `app/register/page.tsx` solo orquesta.
- [x] Todos los iconos de `components/common/icons/Icons.tsx` aceptan la prop opcional `size` y, sin ella, se dibujan a 20px.
- [x] Cada call site de iconos del proyecto pasa el `size` explícito con el que fue diseñado originalmente (tabla del plan, paso 2): ningún ícono existente cambia de tamaño respecto al render actual.

## Decisiones

- **Sí:** ruta `/register` fuera del route group `(app)`, igual que `/login`. Es una pantalla de acceso, no del shell de la app.
- **No:** el botón "Activar mi cuenta" navega. Sin backend, un CTA que redirige simula un flujo que no existe.
- **Sí:** el link "Activá tu cuenta" de `/login` pasa a apuntar a `/register`. Es el punto de entrada pedido y hace que `/register` sea alcanzable desde la UI.
- **Sí:** `data/register/mock-invite.ts` para los datos mock. Sigue la convención de SPEC 02 (data separada de la UI) y deja el cambio de valores en un solo lugar.
- **Sí:** campos prellenados. La pantalla es un mock de una invitación concreta; vacíos se pierde el valor de la vista.
- **Sí:** `input[type=checkbox]` real y marcado en lugar de un `<span>` decorativo. Aporta semántica y es lo más cercano al mockup sin agregar estado.
- **Sí:** `<form>` con `onSubmit` que previene el default. Evita la recarga accidental al presionar Enter, sin introducir validación.
- **Sí:** `Link` de `next/link` para la navegación interna `/register` ↔ `/login`, en lugar de `<a>` crudo como el resto de la app. Navegación client-side sin recargar.
- **Sí:** `size?: number` con default 20 en todos los iconos, en lugar de un default por icono. Un único punto de entrada para el tamaño; el valor por defecto es el que corresponde a la mayoría de los usos.
- **Sí:** cada call site pasa explícitamente su tamaño original. El refactor no puede cambiar el render de `/`, `/kids`, `/kids/[id]` ni `/login`.
- **No:** mantener defaults por icono (17, 18, 19, 21). Con el default 20 más el `size` explícito en los usos, cada ícono queda con un único origen de verdad para su medida.
- **No:** tocar `specs/app/05-login.md`. Su criterio de aceptación sobre "Activá tu cuenta" queda desactualizado a propósito: los specs son registro histórico.
- **No:** captura de Playwright ni comparación visual contra el mockup.

## Riesgos

| Riesgo                                                                                             | Mitigación                                                                                                                          |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| El refactor de la prop `size` afecta iconos compartidos por `/login`, `/`, `/kids` y `/kids/[id]`. | Todos los call sites pasan su tamaño original explícito y `npx tsc --noEmit` + `npm run build` verifican que nada rompe.            |
| Clases Tailwind no canónicas en los estilos nuevos (regla del proyecto desde SPEC 05).             | Escribir las clases en forma canónica desde el inicio y correr `node scripts/canonical-classes.mjs` si reporta clases no canónicas. |

## Qué NO está en este spec

- Activación real de la cuenta, backend, sesión o redirección post-activación.
- Validación de formulario y manejo de errores.
- Persistencia de datos o llamada a la API de invitación.
- Vista de "vincular padre" (`references/pantallas/vincular-padre.dc.html`), que es otra pantalla.
- Cambios a los specs 01–05.

Cada una de esas, si aterriza, va en su propio spec.
