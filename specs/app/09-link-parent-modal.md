# SPEC 09 — Modal "Vincular padre" (`/kids/[id]`)

> **Estado:** Implementado
> **Depende de:** SPEC 04 (perfil del niño), SPEC 07 (modal de alta de niño, patrón `<dialog>`), SPEC 08 (`CustomButton`, `CustomInput`, `ChevronIcon` con `rotate`)
> **Fecha:** 2026-10-30
> **Objetivo:** Implementar el modal "Vincular padre" de `references/pantallas/vincular-padre.dc.html` en `components/kids/LinkParentModal.tsx`, que se abre desde la acción "Vincular otro padre" del panel de padres de `/kids/[id]`, valida nombre y email, y cierra sin persistir.

## Por qué existe este spec

El panel "PADRES VINCULADOS" del perfil del niño tiene la acción "Vincular otro padre" como link muerto `#` desde el SPEC 04, con la nota de que la pantalla destino (`vincular-padre.dc.html`) iba en su propio spec. Este spec cierra ese pendiente: la pantalla del mockup es un modal sobre el perfil, no una página nueva, así que se implementa como un segundo modal client dentro del perfil, reutilizando el patrón de `<dialog>` nativo del SPEC 07 y los componentes `CustomButton` / `CustomInput` del SPEC 08.

## Alcance

**En:**

- Componente client `components/kids/LinkParentModal.tsx` que renderiza el trigger (la acción "Vincular otro padre") y el modal.
- El trigger conserva el markup actual del link muerto: círculo punteado de 40px con borde `1.5px dashed #D8CBBA`, ícono `+` de 18px en `#B0A290` y texto "Vincular otro padre" en `#C5503A`, peso 800, 14.5px. Pasa de `<a href="#">` a `<button type="button">`.
- Modal implementado con el elemento nativo `<dialog>` + `showModal()`, igual que `AddKidModal`: top layer, focus trap, cierre con `Esc`, restauración del foco al trigger, scroll lock del `body` y del `<main>` scrollable, y reset del formulario al cerrar.
- Card interna que replica el mockup: ancho máximo 480px, fondo `#FBF4EC`, borde `#ECE0D0`, radio 24px, sombra `0 20px 50px -24px rgba(63,54,46,.35)`, `overflow: hidden`.
- Header del modal: a la izquierda el bloque de título "Vincular padre" (Fredoka 600, 18px, `#3F362E`) con subtítulo "a {nombre del niño}" (13px, `#A89A8B`); a la derecha un botón de cierre con la `X` de 18px sobre fondo `#F0E6D8` y color `#94887B`, radio 10px.
- Cuerpo del modal con `padding: 22px 26px` y estos bloques, en este orden:
  - Banner informativo azul: fondo `#E3ECFB`, radio 14px, `padding: 13px 16px`, ícono de información de 20px en `#4E72C8` y texto 13.5px `#3F5694`: "Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de {primer nombre del niño}."
  - Campo **NOMBRE DEL PADRE/MADRE**: `CustomInput` de texto, placeholder "Ej. Diego Fernández".
  - Campo **EMAIL**: `CustomInput` de tipo `email`, placeholder "correo@ejemplo.com".
  - Campo **PARENTESCO**: grupo de 3 botones chip, "Mamá" (seleccionado por defecto), "Papá" y "Tutor/a".
  - Bloque **CÓDIGO DE INVITACIÓN**: fondo `#FBF1D6`, borde `1.5px dashed #E6D08A`, radio 16px, `padding: 18px`, código "7K4P9" en Fredoka 600, 34px, `letter-spacing: 7px`, color `#8A7234`, y la línea "Vence en 7 días" en 13px `#A88526`.
  - Botón "Enviar invitación": `CustomButton variant="primary" size="lg"` con ícono de envío de 19px.
- Overlay claro sobre el perfil: `::backdrop` con `rgba(63, 54, 46, 0.25)`, igual que el modal de alta.
- Validación client-side al enviar: nombre vacío → error; email vacío → error; email con formato inválido → error propio. Los errores son inline: borde `#D9583C` (vía `CustomInput error`) + mensaje bajo el campo en `#D9583C` 13px, y el foco se mueve al primer campo inválido.
- "Enviar invitación" con el formulario válido cierra el modal y descarta los datos: no crea ningún padre, no modifica `kid.parents` y no persiste nada.
- El `X` del header y `Esc` cierran el modal sin validar. El click en el overlay no cierra.
- Cambios en `components/common/icons/Icons.tsx`:
  - `CloseIcon`: `X` de 18px (`M18 6 6 18M6 6l12 12`), `stroke="currentColor"`, `strokeWidth="2.2"`.
  - `InfoIcon`: círculo `r=10` con `M12 16v-4M12 8h.01`, `stroke="currentColor"`, `strokeWidth="2"`.
  - `SendIcon`: avión de papel (`m22 2-7 20-4-9-9-4z` + `M22 2 11 13`), `stroke="#fff"`, `strokeWidth="2"`.
  - `PlusIcon` pasa de `stroke="#fff"` a `stroke="currentColor"`: el color lo define el call site. `AddKidModal` lo sigue viendo blanco porque el botón que lo contiene tiene `text-white`.
- Cambios en `components/common/ui/CustomButton.tsx`:
  - Nueva `variant="chip"` y nueva prop booleana `selected` (default `false`).
  - `chip` seleccionado: fondo `#CCD8F4`, borde `1.5px solid #9FB8EC`, texto `#4E72C8`.
  - `chip` no seleccionado: fondo `#FFFDF9`, borde `1.5px solid #ECE0D0`, texto `#6E6359`.
  - Ambos chips: `flex-1`, `padding: 11px`, radio 999px, peso 800, 14px.
- Cambios en `components/common/ui/CustomInput.tsx`: se exporta la constante de clase del label (`inputLabelClass`) para que el campo "PARENTESCO" use exactamente el mismo estilo de label que los inputs de texto.
- Cambio en `components/kids/KidProfile.tsx`: el bloque `<a href="#">` "Vincular otro padre" se reemplaza por `<LinkParentModal kidName={kid.name} />`. El resto de `KidProfile` queda igual.
- El subtítulo del header usa el nombre completo del niño ("a Mateo Fernández"); el banner informativo usa el primer nombre ("el feed de Mateo").

**Fuera del alcance (para specs futuros):**

- Persistencia del padre vinculado: no se agrega a `kid.parents`, no hay `localStorage` ni backend. La invitación se descarta al cerrar.
- Envío real de email con el código de invitación.
- Un estado de éxito ("invitación enviada") después de enviar, o un toast.
- Generación del código de invitación: el código "7K4P9" y el texto "Vence en 7 días" son fijos.
- Un `CustomRadio` o `CustomChip` genérico como componente separado: los chips viven como `variant="chip"` de `CustomButton`.
- Ampliar el tipo `KidParent.role` con `"Tutor/a"`: no hay datos que persistir, así que el tipo no cambia.
- Cambios en `app/(app)/kids/[id]/page.tsx`: la page sigue siendo un server component que solo orquesta.
- Editar niño, resumen del día y el resto de links muertos del perfil.
- Cambios en los specs 01 a 08: quedan como registro histórico.

## Modelo de datos

No se introducen estructuras de datos persistentes. Este spec solo define estado local de componente y props.

```tsx
// components/kids/LinkParentModal.tsx
// Estado local (useState), no global, no persistido.

export type ParentRole = "Mamá" | "Papá" | "Tutor/a";

export interface LinkParentFormState {
  name: string;
  email: string;
  role: ParentRole;
}

type LinkParentField = "name" | "email";
type LinkParentErrors = Partial<Record<LinkParentField, string>>;

// components/common/ui/CustomButton.tsx
export type CustomButtonVariant = "primary" | "cancel" | "save" | "chip";

export interface CustomButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> {
  variant?: CustomButtonVariant;
  type?: CustomButtonType;
  size?: CustomButtonSize;
  selected?: boolean; // solo tiene efecto en variant="chip"
  children: ReactNode;
}
```

Convenciones:

- Las opciones de parentesco viven como constante local del componente, en el orden del mockup: `["Mamá", "Papá", "Tutor/a"]`. "Mamá" viene preseleccionado.
- El valor inicial del formulario es `{ name: "", email: "", role: "Mamá" }`.
- El código de invitación es una constante del componente: `INVITATION_CODE = "7K4P9"` y `INVITATION_EXPIRY_LABEL = "Vence en 7 días"`.
- `KidParent.role` (`"Mamá" | "Papá"`) y `data/kids/mock-kids.ts` quedan sin cambios: nada se persiste.

## Plan de implementación

1. En `components/common/icons/Icons.tsx`, agregar `CloseIcon`, `InfoIcon` y `SendIcon` siguiendo el estilo del archivo (`viewBox="0 0 24 24"`, `fill="none"`, `rotate` soportado vía `rotateStyle`). Verificación: `npx tsc --noEmit` pasa y los tres iconos se ven al montarlos.

2. En el mismo archivo, cambiar el `stroke` de `PlusIcon` de `"#fff"` a `"currentColor"`. Verificación: `/kids` sigue mostrando el "Agregar niño" con el `+` blanco (el `CustomButton` tiene `text-white`).

3. En `components/common/ui/CustomButton.tsx`, agregar la `variant="chip"` y la prop `selected`. Verificación: `npx tsc --noEmit` pasa; el botón existente con `variant="primary"` no cambia de aspecto.

4. En `components/common/ui/CustomInput.tsx`, exportar la constante de clase del label (por ejemplo `inputLabelClass`) sin cambiar el markup ni las clases que se aplican. Verificación: `npx tsc --noEmit` pasa y `/kids` (modal de alta) sigue igual.

5. Crear `components/kids/LinkParentModal.tsx` con `"use client"`, un `ref` al `<dialog>`, refs a los campos, estado del formulario, errores, el lock/unlock de scroll (mismo approach que `AddKidModal`: `body` + `closest("main")`) y los handlers `openModal` / `closeModal` / `handleClose` (reset del formulario + foco al trigger). Verificación: el componente compila y el trigger "Vincular otro padre" se ve idéntico al link actual.

6. Montar el `<dialog>` con la card del mockup: ancho máximo 480px (`w-[calc(100%-2rem)] max-w-120`), fondo `#FBF4EC`, borde `#ECE0D0`, radio 24px, sombra `0 20px 50px -24px rgba(63,54,46,.35)`, header con título "Vincular padre" + subtítulo "a {kidName}" + botón `X`, y cuerpo con `padding: 22px 26px`. El `<dialog>` lleva `aria-labelledby` apuntando al id del título. Verificación: el modal abre centrado, con overlay `rgba(63,54,46,0.25)` detrás.

7. Agregar el banner informativo, los dos `CustomInput` (nombre y email), el grupo de parentesco (3 `CustomButton variant="chip"`, con `aria-pressed` y estado local `form.role`), el bloque del código de invitación y el botón "Enviar invitación" (`CustomButton variant="primary" size="lg"` con `SendIcon`). Verificación: la card se ve igual que `references/pantallas/vincular-padre.dc.html`.

8. Implementar la validación en el submit: nombre vacío, email vacío y email con formato inválido producen error; el modal no cierra. El foco se mueve al primer campo inválido. Verificación: al enviar vacío se ven 2 errores y el modal sigue abierto.

9. Implementar el cierre: `X` y `Esc` cierran sin validar, el click en el overlay no cierra, y "Enviar invitación" cierra solo si no hay errores. En el evento `close` se resetea el formulario (valores y errores) y se restaura el scroll. Verificación: abrir, cerrar y reabrir muestra el formulario vacío.

10. En `components/kids/KidProfile.tsx`, reemplazar el `<a href="#">` "Vincular otro padre" por `<LinkParentModal kidName={kid.name} />`. Verificación: `/kids/kid-mateo` muestra el trigger igual que antes y abre el modal; `/kids/kid-valentina` (0 padres) también lo muestra y lo abre.

11. Correr `npm run lint`, `npx tsc --noEmit`, `npm run build` y `node scripts/canonical-classes.mjs`. Verificación: los cuatro pasan sin errores ni clases no canónicas nuevas.

## Criterios de aceptación

- [x] `npm run build`, `npm run lint`, `npx tsc --noEmit` y `node scripts/canonical-classes.mjs` pasan sin errores.
- [x] `components/kids/LinkParentModal.tsx` es un client component y exporta `LinkParentModal`.
- [x] La acción "Vincular otro padre" del panel "PADRES VINCULADOS" es un `<button type="button">` que abre el modal, en todos los perfiles (también con 0 padres).
- [x] El trigger conserva el círculo punteado de 40px (`1.5px dashed #D8CBBA`), el ícono `+` de 18px en `#B0A290` y el texto "Vincular otro padre" en `#C5503A`, peso 800, 14.5px.
- [x] El modal aparece centrado sobre `/kids/[id]` con overlay `rgba(63, 54, 46, 0.25)` detrás.
- [x] La card mide como máximo 480px de ancho, con fondo `#FBF4EC`, borde `#ECE0D0`, radio 24px y sombra `0 20px 50px -24px rgba(63,54,46,.35)`.
- [x] El header muestra "Vincular padre" (Fredoka 600, 18px, `#3F362E`), el subtítulo "a {nombre completo del niño}" (13px, `#A89A8B`) y un botón `X` de 18px sobre fondo `#F0E6D8` con color `#94887B`.
- [x] El cuerpo tiene `padding: 22px 26px`.
- [x] El banner informativo tiene fondo `#E3ECFB`, radio 14px, ícono de información de 20px en `#4E72C8` y texto 13.5px `#3F5694` que dice "Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de {primer nombre del niño}."
- [x] NOMBRE DEL PADRE/MADRE es un `CustomInput` de texto con placeholder "Ej. Diego Fernández" y label 12px peso 800 `letter-spacing: .7px` `#94887B`.
- [x] EMAIL es un `CustomInput` de tipo `email` con placeholder "correo@ejemplo.com" y el mismo estilo de label.
- [x] PARENTESCO muestra 3 chips: "Mamá" (seleccionado por defecto), "Papá" y "Tutor/a"; el seleccionado tiene fondo `#CCD8F4`, borde `#9FB8EC` y texto `#4E72C8`, los no seleccionados fondo `#FFFDF9`, borde `#ECE0D0` y texto `#6E6359`.
- [x] El bloque CÓDIGO DE INVITACIÓN tiene fondo `#FBF1D6`, borde `1.5px dashed #E6D08A`, radio 16px, el código "7K4P9" en Fredoka 600 34px `letter-spacing: 7px` `#8A7234` y el texto "Vence en 7 días" en 13px `#A88526`.
- [x] "Enviar invitación" es un botón full width con el gradiente `#F4977E → #EE8164`, el ícono de envío de 19px y el texto blanco.
- [x] "Enviar invitación" con nombre vacío no cierra el modal y muestra "Este campo es obligatorio" bajo el campo de nombre.
- [x] "Enviar invitación" con email vacío no cierra el modal y muestra "Este campo es obligatorio" bajo el campo de email.
- [x] "Enviar invitación" con email con formato inválido no cierra el modal y muestra un mensaje de formato bajo el campo de email.
- [x] Al enviar con errores, el foco queda en el primer campo inválido.
- [x] "Enviar invitación" con el formulario válido cierra el modal y no crea ni modifica ningún padre en el panel "PADRES VINCULADOS".
- [x] El `X` del header cierra el modal sin validar; `Esc` también lo cierra.
- [x] Un click en el overlay no cierra el modal.
- [x] Al reabrir el modal, el formulario está vacío, sin errores y con "Mamá" preseleccionado.
- [x] Mientras el modal está abierto, el `body` y el `<main>` no scrollean; al cerrar, vuelven a scrollear con normalidad.
- [x] Al abrir, el foco cae en el input de nombre; al cerrar, el foco vuelve a la acción "Vincular otro padre".
- [x] El `<dialog>` tiene `aria-labelledby` apuntando al título "Vincular padre".
- [x] En viewports < `lg` el modal no tiene scroll horizontal: ancho `calc(100% - 2rem)` con tope de 480px, y el contenido largo hace scroll vertical dentro del modal.
- [x] `components/common/icons/Icons.tsx` exporta `CloseIcon`, `InfoIcon` y `SendIcon`, y todos aceptan `size` y `rotate`.
- [x] `PlusIcon` usa `stroke="currentColor"` y el "Agregar niño" de `/kids` sigue mostrando el `+` en blanco.
- [x] `CustomButton` acepta `variant="chip"` y la prop `selected`; el chip seleccionado y el no seleccionado tienen los fondos, bordes y textos indicados.
- [x] `CustomInput` exporta la clase de label reutilizada por el campo PARENTESCO.
- [x] `data/kids/mock-kids.ts`, el tipo `KidParent` y `KidProfile` (fuera del bloque reemplazado) quedan sin cambios.
- [x] `app/(app)/kids/[id]/page.tsx` sigue siendo un server component que solo orquesta.

## Decisiones

- **Sí:** modal client `components/kids/LinkParentModal.tsx` con el trigger adentro, en vez de un trigger en `KidProfile` y el modal en otro archivo. El trigger necesita el `ref` del `<dialog>` para abrirlo y para recuperar el foco al cerrar; separarlos obligaría a subir el estado a `KidProfile`, que hoy es un server component.
- **Sí:** `<dialog>` nativo con `showModal()`, reutilizando el patrón del SPEC 07. Aporta top layer, focus trap, `Esc` y restauración del foco sin dependencias, y el repo no tiene librerías de UI.
- **Sí:** overlay claro `rgba(63,54,46,0.25)`, el mismo del modal de alta. El mockup se renderiza como página y no muestra overlay; sobre el perfil hace falta un velo para separar el modal del fondo.
- **No:** cerrar con click en el overlay. Evita perder lo tipeado por un click accidental; el mockup tampoco sugiere esa interacción.
- **Sí:** "Enviar invitación" valida y cierra, sin efecto sobre los datos. Sin backend, un CTA que "envía" algo que se pierde al recargar sería UI falsa, la misma línea que siguió el repo en el SPEC 07.
- **No:** agregar el padre a `kid.parents` en memoria. Se descartaría al recargar y obligaría a mover el estado de la lista a un client component.
- **Sí:** la validación corre al enviar, no en vivo. Evita mostrar errores mientras el usuario todavía está por completar el campo.
- **Sí:** nombre y email son obligatorios, y el email se valida con formato (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`). Sin email válido el flujo de "le enviaremos un correo con un código" no tiene sentido.
- **Sí:** errores inline (borde `#D9583C` + mensaje bajo el campo) vía la prop `error` de `CustomInput`, con foco en el primer campo inválido.
- **Sí:** el código de invitación y "Vence en 7 días" son constantes visibles desde la apertura. El mockup los muestra en el estado inicial y no hay backend que los genere.
- **Sí:** el código "7K4P9" se muestra siempre, no solo después de enviar. El mockup lo ubica en el cuerpo del formulario, antes del botón de envío.
- **Sí:** el subtítulo del header usa el nombre completo ("a Mateo Fernández") y el banner usa el primer nombre ("el feed de Mateo"), siguiendo el mockup.
- **Sí:** "Mamá" queda preseleccionado, como en el mockup, y los chips son de selección única (una sola `ParentRole` en el estado).
- **Sí:** los chips se implementan como `variant="chip"` de `CustomButton` en lugar de un `CustomChip` nuevo. Reutiliza el componente existente como pidió el usuario y evita un segundo componente de botón con el mismo propósito.
- **Sí:** la prop booleana `selected` en `CustomButton` en lugar de una variant más (`chip-selected`). Dos variants para el mismo control permiten combinaciones inválidas; una prop booleana con un solo sentido de lectura es más simple de usar.
- **Sí:** el chip usa `aria-pressed` para comunicar el estado a lectores de pantalla, dado que no son radios nativos.
- **Sí:** `PlusIcon` pasa a `stroke="currentColor"`. El ícono se usa en dos contextos con colores distintos (blanco sobre el gradiente y `#B0A290` sobre el círculo punteado); el color lo define el call site, igual que ya hacía `ChevronIcon` en el SPEC 08.
- **No:** agregar una prop `color` a `IconProps`. El mismo criterio del SPEC 08: `rotate` y `currentColor` cubren los casos de uso reales.
- **Sí:** exportar la clase del label desde `CustomInput` (`inputLabelClass`) para el campo PARENTESCO. Duplicar la cadena de clases en el modal la dejaría desincronizada en el próximo cambio de estilo.
- **No:** ampliar `KidParent.role` con `"Tutor/a"`. Como nada se persiste, el tipo no necesita cambiar; ampliarlo "por si acaso" afectaría al SPEC 04 sin un consumidor.
- **No:** un estado de éxito o un toast tras enviar. El usuario eligió explícitamente "valida y cierra, sin persistir"; un estado de éxito es un flujo distinto.
- **No:** convertir `app/(app)/kids/[id]/page.tsx` en client component. La page sigue siendo server y solo monta componentes.
- **No:** tocar los specs 01 a 08. El link muerto "Vincular otro padre" del SPEC 04 queda desactualizado a propósito.

## Riesgos

| Riesgo                                                                                                               | Mitigación                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| El `<dialog>` trae estilos por defecto del navegador (padding, borde, fondo blanco, `max-width` calculado).          | Resetear con clases (`p-0 border-0 bg-transparent`) y fijar el ancho a mano, como en `AddKidModal`.                                    |
| El ancho por defecto del `<dialog>` modal lo deja a `calc(100% - 6px - 2em)`, con padding extra.                     | Definir el ancho explícitamente con `w-[calc(100%-2rem)] max-w-120`.                                                                   |
| Cambiar el `stroke` de `PlusIcon` a `currentColor` puede alterarlo en otros call sites.                              | El único otro uso es el botón "Agregar niño", cuyo `CustomButton` tiene `text-white`: el `+` sigue blanco.                             |
| El scroll lock del `body` no es nativo de `<dialog>`; si no se restaura, el perfil queda sin scroll.                 | Bloquear al abrir y restaurar en el evento `close`, que también dispara `Esc` y el `X`.                                                |
| `showModal()` sobre un dialog ya abierto lanza `InvalidStateError`.                                                  | Guardar con `if (!dialog.open)` antes de llamar `showModal()`.                                                                         |
| La card del mockup mide 480px y la de `AddKidModal` 520px; un `<dialog>` sin ancho fijo cambia según el contenido.   | Fijar el ancho con `max-w-120` y `w-[calc(100%-2rem)]` en el `<dialog>`.                                                               |
| El grupo de parentesco no es un control nativo de un solo radio, así que el estado vive en el estado del formulario. | Estado local con `role` única y `aria-pressed` en cada chip; el submit no persiste nada, así que no hay estado global que sincronizar. |

## Qué NO está en este spec

- Persistencia del padre vinculado, backend, API y envío real del email con el código.
- Un estado de éxito o un toast después de "Enviar invitación".
- Generación del código de invitación y cálculo real de la fecha de vencimiento.
- Ampliar el tipo `KidParent.role` con `"Tutor/a"`.
- Un `CustomChip` o `CustomRadio` como componente separado.
- Editar niño, resumen del día y el resto de links muertos del perfil.
- Captura de Playwright y comparación visual contra el mockup.
- Cambios a los specs 01 a 08.

Cada una de esas, si aterriza, va en su propio spec.
