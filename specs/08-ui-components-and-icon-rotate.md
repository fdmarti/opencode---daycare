# SPEC 08 — Iconos con `rotate` y componentes UI reutilizables (`CustomButton`, `CustomInput`)

> **Estado:** Implementado
> **Depende de:** SPEC 02 (estructura de carpetas), SPEC 03 (listado de niños), SPEC 05 (login), SPEC 06 (register), SPEC 07 (modal de alta de niño)
> **Fecha:** 2026-10-30
> **Objetivo:** Agregar la prop `rotate` a todos los iconos, unificar los tres chevrons en un solo `ChevronIcon` y crear los componentes reutilizables `CustomButton` y `CustomInput` en `components/common/ui/`, migrando las pantallas actuales a ellos.

## Por qué existe este spec

Hoy el proyecto tiene estilos duplicados: el botón "Agregar Niño" y los botones "Iniciar sesión"/"Activar mi cuenta" comparten gradiente pero difieren en padding, radio y sombra; los inputs de `AddKidModal`, `LoginForm` y `RegisterForm` repiten las mismas clases con variaciones mínimas; y existen tres variantes de chevron que se distinguen solo por la dirección del `path` y por un `stroke` hardcodeado. Este spec centraliza esas tres piezas en `components/common/ui/` y unifica los chevrons en `ChevronIcon`, sin cambiar la apariencia de ninguna pantalla.

## Alcance

**En:**

- `IconProps` (en `components/common/icons/Icons.tsx`) gana `rotate?: number` con default `0`.
- Todos los iconos de `Icons.tsx` aceptan `rotate` y aplican la rotación con `style={{ transform: \`rotate(${rotate}deg)\` }}`sobre el`<svg>`.
- Un único export `ChevronIcon` con `path` base "chevron hacia abajo" (`d="m6 9 6 6 6-6"`), `stroke="currentColor"` y sin `className` interno. Se eliminan `ChevronIconLeft`, `ChevronIconRight` y `ChevronIconDown`.
- Nueva carpeta `components/common/ui/` con:
  - `CustomButton.tsx`: prop `variant` (`"primary"` default, `"cancel"`, `"save"`), prop `type` (`"button"` | `"submit"`), prop `size` (`"md"` default, `"lg"`), `children` obligatorio y reenvío de `onClick`, `className`, `disabled`, `form`, `name`, `id`, `ref` y atributos `aria-*`.
  - `CustomInput.tsx`: renderiza `label` + `input` + mensaje de error; `type` limitado a `"text" | "email" | "password" | "number" | "date"`; `variant` (`"field"` default, `"bare"`); prop `className` para el wrapper y prop `inputClassName` para clases extra del `<input>`; reenvío de `ref`.
- Migración de `components/kids/AddKidModal.tsx`:
  - Botón "Agregar Niño" → `CustomButton variant="primary" size="md" type="button"`.
  - Botón "Cancelar" → `CustomButton variant="cancel" type="button"`.
  - Botón "Guardar" → `CustomButton variant="save" type="submit" form={FORM_ID}`.
  - Inputs de nombre, fecha de nacimiento y alergias → `CustomInput`.
  - El chevron del `<select>` de SALA pasa a `ChevronIcon rotate={0}` envuelto en un `<span>` posicionado en el call site.
- Migración de `components/login/LoginForm.tsx`: inputs de email y password → `CustomInput`; "Iniciar sesión" → `CustomButton variant="primary" size="lg" type="button"`.
- Migración de `components/register/RegisterForm.tsx`: inputs de código de invitación, email y contraseña → `CustomInput`; "Activar mi cuenta" → `CustomButton variant="primary" size="lg" type="submit"`.
- Migración de `app/(app)/kids/page.tsx`: el buscador pasa a `CustomInput variant="bare"`.
- Migración de los chevrons en `components/kids/KidCard.tsx`, `components/kids/KidNotFound.tsx` y `components/kids/KidProfile.tsx` a `ChevronIcon` con `rotate`.
- Se conservan sin cambios el `<select>` de SALA, el `<textarea>` de NOTAS MÉDICAS, el `<input type="checkbox">` de autorización de `RegisterForm` y los `<a>` dead links.

**Fuera del alcance (para specs futuros):**

- Un `CustomSelect`, `CustomTextarea` y `CustomCheckbox`: quedan como markup local en `AddKidModal` y `RegisterForm`.
- Un `CustomLabel` o `CustomField`: el label vive dentro de `CustomInput`.
- Persistencia, validación de negocio o cambios en el comportamiento de los formularios: este spec es solo de estilos y de estructura de componentes.
- Cambios de comportamiento en login/register (hoy no hay submit real) más allá de cambiar `<a>` por `<button>`.
- Rediseño visual: las diferencias de padding, sombra, borde y tipografía se estandarizan a los valores ya aprobados en SPEC 07.

## Modelo de datos

No se introducen estructuras de datos nuevas. Este spec solo define props de componentes.

```tsx
// components/common/icons/Icons.tsx
export interface IconProps {
  /** Rendered width and height in pixels. Defaults to 20. */
  size?: number;
  /** Clockwise rotation in degrees. Defaults to 0. */
  rotate?: number;
}

// components/common/ui/CustomButton.tsx
export type CustomButtonVariant = "primary" | "cancel" | "save";
export type CustomButtonType = "button" | "submit";
export type CustomButtonSize = "md" | "lg";

export interface CustomButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> {
  variant?: CustomButtonVariant; // default "primary"
  type?: CustomButtonType; // default "button"
  size?: CustomButtonSize; // default "md"
  children: React.ReactNode;
}

// components/common/ui/CustomInput.tsx
export type CustomInputType = "text" | "email" | "password" | "number" | "date";
export type CustomInputVariant = "field" | "bare";

export interface CustomInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  type?: CustomInputType; // default "text"
  variant?: CustomInputVariant; // default "field"
  label?: string; // ignored when variant is "bare"
  error?: string; // when set, the border turns red and the message shows
  className?: string; // extra classes for the wrapper
  inputClassName?: string; // extra classes for the <input>
}
```

### Tabla de rotación de `ChevronIcon`

| Dirección | `rotate` | Path resultante                                         |
| --------- | -------- | ------------------------------------------------------- |
| Abajo     | `0`      | `m6 9 6 6 6-6`                                          |
| Arriba    | `180`    | `m15 6-6 6 6-6` (equivalente a la base rotada)          |
| Izquierda | `90`     | `m15 18-6-6 6-6` (idéntico al `ChevronIconLeft` actual) |
| Derecha   | `-90`    | `m9 18 6-6-6-6` (idéntico al `ChevronIconRight` actual) |

La geometría base está chosen para que rotar 90° reproduzca exactamente el path del chevron izquierdo actual y rotar -90° el del derecho.

## Plan de implementación

1. En `components/common/icons/Icons.tsx`, agregar `rotate?: number` a `IconProps` y aplicar `style={{ transform: \`rotate(${rotate}deg)\` }}`en el`<svg>`de cada icono existente. Verificar en`/login`(ícono`SunIcon`) y `/kids`(íconos de`KidCard`) que nada cambia visualmente.

2. En el mismo archivo, reemplazar `ChevronIconLeft`, `ChevronIconRight` y `ChevronIconDown` por un único `ChevronIcon` con path base `m6 9 6 6 6-6`, `stroke="currentColor"`, `strokeWidth="2.2"`, sin `className` interno y con soporte de `rotate`. Verificar: `rotate={90}` dibuja el chevron izquierdo y `rotate={-90}` el derecho.

3. Crear `components/common/ui/CustomButton.tsx` con el mapeo de variantes:
   - `primary` / `md` (gradiente de "Agregar Niño"): `flex items-center gap-2 px-4.5 py-2.75 rounded-[14px] bg-linear-to-b from-[#F4977E] to-[#EE8164] text-white font-extrabold text-[14.5px] shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)] transition duration-150 hover:cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-8px_rgba(238,129,100,0.85)] active:translate-y-0`.
   - `primary` / `lg` (botón full-width de login/register): `w-full p-3.75 rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] text-white font-extrabold text-[16px] shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] transition duration-150 hover:cursor-pointer hover:-translate-y-0.5`.
   - `cancel`: `text-[15px] font-bold text-mute transition-colors duration-150 hover:cursor-pointer hover:text-tinta`.
   - `save`: `text-[15px] font-extrabold text-acento transition-colors duration-150 hover:cursor-pointer hover:text-acento-editar`.
   - `size` solo afecta a `primary`; `cancel` y `save` ignoran `size`.

4. Crear `components/common/ui/CustomInput.tsx`:
   - `variant="field"`: wrapper `div` con `className` opcional; `label` con `block text-[12px] font-extrabold tracking-[0.7px] text-mute mb-2` y `htmlFor` igual al `id`; `input` con `w-full p-[13px_16px] rounded-[14px] border-[1.5px] bg-white text-[15px] text-tinta` y borde `border-acento` cuando hay `error`, `border-[#EADFD0]` cuando no; mensaje de error `p` con `mt-1.5 mb-0 text-[13px] text-acento`.
   - `variant="bare"`: sin `label` ni mensaje de error; el `input` queda con `flex-1 border-none bg-none text-[15px] text-tinta` (se usa en el buscador de `/kids`).
   - El `ref` se reenvía al `<input>` (React 19 permite `ref` como prop de un function component).

5. Migrar `components/kids/AddKidModal.tsx`: reemplazar los tres botones por `CustomButton` y los tres inputs de escritura por `CustomInput`, conservando `fieldRefs`, el `id` de cada campo, los `placeholder`, el `max` de la fecha, los valores controlados y los mensajes de error. El `<select>` de SALA y el `<textarea>` quedan como están; su chevron pasa a `<span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#B0A290]"><ChevronIcon rotate={0} /></span>`. Verificar que el submit, el foco al primer campo inválido y el reset sigan funcionando.

6. Migrar `components/login/LoginForm.tsx`: email y password a `CustomInput` (labels `EMAIL` y `CONTRASEÑA`, sin estado de error) y el `<a>` "Iniciar sesión" a `CustomButton variant="primary" size="lg" type="button"`.

7. Migrar `components/register/RegisterForm.tsx`: los tres inputs a `CustomInput` (el de código conserva `font-display text-[18px] tracking-[3px]` vía `inputClassName`) y el `<a>` "Activar mi cuenta" a `CustomButton variant="primary" size="lg" type="submit"`.

8. Migrar `app/(app)/kids/page.tsx`: el buscador a `CustomInput variant="bare" placeholder="Buscar niño…"`.

9. Migrar los chevrons restantes: `KidCard.tsx` (`rotate={-90}` dentro de `<span className="flex-none text-[#CBB89F]">`), `KidNotFound.tsx` y `KidProfile.tsx` (`rotate={90}`, sin wrapper porque el color lo hereda del `Link` que ya es `text-mute`).

10. Correr `npm run lint` y `npx tsc --noEmit` para confirmar que no quedan imports rotos de los chevrons eliminados.

## Criterios de aceptación

- [x] `IconProps` declara `rotate?: number` y todos los iconos de `Icons.tsx` lo aceptan.
- [x] `ChevronIcon` con `rotate={0}` dibuja el chevron hacia abajo, con `rotate={90}` hacia la izquierda y con `rotate={-90}` hacia la derecha.
- [x] `ChevronIconLeft`, `ChevronIconRight` y `ChevronIconDown` ya no se exportan y ningún archivo del proyecto los importa.
- [x] El chevron con `rotate={90}` se ve idéntico al `ChevronIconLeft` anterior (mismo path y mismo color `text-mute` heredado).
- [x] El chevron con `rotate={-90}` se ve idéntico al `ChevronIconRight` anterior (color `#CBB89F`).
- [x] El chevron del select de SALA se ve idéntico al `ChevronIconDown` anterior (color `#B0A290`, posicionado a la derecha y centrado verticalmente).
- [x] Existe `components/common/ui/CustomButton.tsx` con props `variant`, `type`, `size` y `children`.
- [x] `CustomButton` sin props de estilo renderiza el botón con el aspecto de "Agregar Niño" (gradiente, padding `px-4.5 py-2.75`, radio 14px, sombra, hover con elevación).
- [x] `CustomButton variant="cancel"` renderiza "Cancelar" con el estilo de texto mute y `variant="save"` renderiza "Guardar" con el estilo de texto acento.
- [x] `CustomButton` reenvía `onClick`, `disabled`, `form`, `name`, `id`, `className` y `ref` al `<button>` renderizado.
- [x] Existe `components/common/ui/CustomInput.tsx` y renderiza `label`, `input` y, si se pasa `error`, el mensaje de error debajo del campo.
- [x] `CustomInput` con `error` muestra el borde `border-acento`; sin `error` muestra `border-[#EADFD0]`.
- [x] `CustomInput variant="bare"` no renderiza label ni mensaje de error.
- [x] `CustomInput` acepta `type` solo entre `text`, `email`, `password`, `number` y `date`.
- [x] El `ref` de `CustomInput` apunta al `<input>` renderizado.
- [x] `AddKidModal` usa `CustomButton` para "Agregar Niño", "Cancelar" y "Guardar", y `CustomInput` para nombre, fecha de nacimiento y alergias.
- [x] El submit del modal sigue validando nombre, fecha (incluida la fecha futura) y sala, y sigue enfocando el primer campo inválido.
- [x] `LoginForm` usa `CustomInput` para email y password y `CustomButton` para "Iniciar sesión".
- [x] `RegisterForm` usa `CustomInput` para código de invitación, email y contraseña, y `CustomButton` para "Activar mi cuenta".
- [x] El buscador de `/kids` usa `CustomInput variant="bare"` y se ve igual que antes (sin borde, alineado a la izquierda dentro de la card).
- [x] `npm run lint` y `npx tsc --noEmit` terminan sin errores.
- [x] `npm run build` termina sin errores.

## Decisiones

- **Sí:** aplicar `rotate` con `style={{ transform: ... }}` en vez de una clase de Tailwind. Una clase `rotate-[${rotate}deg]` construida en runtime no la detecta el compilador de Tailwind v4, y un mapa de ángulos a clases estáticas obligaría a mantener una lista cerrada de valores.
- **Sí:** un único `ChevronIcon` en lugar de tres exports. Los tres paths se derivan del mismo path base rotado, así que un solo componente elimina la duplicación sin cambiar el dibujo.
- **Sí:** `stroke="currentColor"` en `ChevronIcon`. El color lo define el call site con una clase de texto, así el icono no tiene colores propios.
- **No:** agregar props `color` o `className` a `IconProps`. `rotate` es lo único que hace falta en todos los iconos; el posicionamiento y el color se resuelven en el call site con un `<span>` wrapper.
- **Sí:** envolver los chevrons que necesitan color o posicionamiento en un `<span>` en el call site. Es el único mecanismo disponible sin agregar `className` al icono.
- **Sí:** `CustomButton` con prop `variant` en lugar de props booleanas. Una prop booleana por estilo no escala y obliga a combinaciones inválidas.
- **Sí:** prop `size` (`"md" | "lg"`) en `CustomButton`. Los botones de login/register tienen padding, radio, tamaño de texto y sombra distintos del de "Agregar Niño"; resolverlo con `className` libre generaría utilidades de Tailwind en conflicto (`px-4.5` vs `p-3.75`, `rounded-[14px]` vs `rounded-[15px]`).
- **Sí:** `CustomInput` como un componente que incluye label, input y mensaje de error. Los cuatro patrones de uso del repo repiten exactamente esa estructura.
- **Sí:** `variant` en `CustomInput` para el buscador sin borde de `/kids`, en lugar de una segunda serie de props de estilo.
- **No:** crear `CustomSelect`, `CustomTextarea` o `CustomCheckbox`. Cada uno aparece en un solo lugar y sus estilos difieren de los inputs; forzarlos a compartir un componente agregaría props sin valor.
- **No:** migrar los `<a>` dead links a `CustomButton` salvo los dos de login/register, que son visualmente botones y el usuario pidió migrarlos.
- **Sí:** estandarizar el input al padding y la etiqueta de SPEC 07 (`p-[13px_16px]`, label en `font-extrabold`, borde `#EADFD0`). Los inputs de login/register usaban `p-[14px_16px]`, label en `font-bold` y un borde `#F2A78E` en la contraseña. Diferencias de 1px y de peso, documentadas aquí como后果encias aceptadas.
- **No:** reescribir el `<select>` de SALA y el `<textarea>` de NOTAS MÉDICAS con `CustomInput`. Quedan como markup local.
- **Sí:** migrar todas las pantallas con inputs de escritura (login, register, modal de alta, buscador) en este mismo spec. Dejar pantallas a medias daría dos caminos de estilos para el mismo control.

## Riesgos

| Riesgo                                                                                                                                                                                                                      | Mitigación                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La rotación con `transform` en CSS gira alrededor del centro del `viewBox` (equivalente al de los paths originales), pero un navegador con `transform-box: border-box` giraría alrededor del centro del `<svg>` renderizado | Ambos puntos coinciden porque el `viewBox` 24×24 se escala al `width`/`height` del svg; el centro es el mismo. Verificar visualmente los tres chevrons. |
| `ChevronIconRight` y `ChevronIconDown` tenían `stroke` hardcodeado y `ChevronIconDown` además posicionamiento absoluto; al unificarlos, un call site sin wrapper quedaría sin color o desalineado                           | Los tres call sites se migran en el mismo spec, cada uno con su `<span>` wrapper y su clase de color.                                                   |
| Cambiar `<a>` por `<button>` en login/register altera semántica y navegación (antes el enlace tenía `href="#"`)                                                                                                             | Ambos botones no tenían destino real; ahora `type="button"` en login y `type="submit"` dentro del `form` de register, que ya tiene `preventDefault`.    |
| Los inputs de login/register no son controlados; `CustomInput` debe soportar `defaultValue`                                                                                                                                 | `CustomInputProps` extiende `InputHTMLAttributes`, por lo que `value`, `defaultValue` y `onChange` se reenvían sin cambios.                             |
| Los inputs con borde `#F2A78E` (contraseña de register) se estandarizan a `#EADFD0`, un cambio visual de 1px de color                                                                                                       | Documentado en Decisiones; el mockup de referencia usa borde estándar.                                                                                  |

## Lo que **no** entra en este spec

- `CustomSelect`, `CustomTextarea` y `CustomCheckbox`.
- Persistencia, backend, sesión y validación de negocio.
- Rediseño visual de login, register, kids o del modal: solo se centralizan estilos ya existentes.
- Un componente de campo genérico (`CustomField`) o un `CustomLabel`.
- Cambios en el comportamiento de los formularios de login y register.
