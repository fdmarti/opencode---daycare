# SPEC 10 — Modal "Nueva publicación" (feed)

> **Estado:** Implementado
> **Depende de:** SPEC 01 (feed), SPEC 07 (patrón de modal con `<dialog>`), SPEC 08 (`CustomButton`, `CustomInput`), SPEC 09 (modal "Vincular padre", estilo de chip)
> **Fecha:** 2026-10-30
> **Objetivo:** Implementar el modal "Nueva publicación" de `references/pantallas/crear-publicacion.dc.html`, que se abre desde el botón "Nueva publicación" del sidebar, permite elegir destinatarios (PARA), tipo (TIPO) y descripción, y se cierra sin persistir nada.

## Por qué existe este spec

El botón "Nueva publicación" del sidebar (`components/layout/Sidebar.tsx`) es un `<a href="#">` muerto desde el SPEC 01. Este spec lo convierte en el trigger de un modal real con el patrón ya establecido en el repo (`<dialog>` nativo + `showModal()`), y agrega el componente `Badge` reutilizable en `components/common/ui/` que el usuario pidió para las opciones de TIPO (y que se reutiliza también en los chips de PARA).

## Alcance

**En:**

- Nuevo componente reutilizable `components/common/ui/Badge.tsx`:
  - Prop `active?: boolean` (default `false`) y **un solo par de colores**: activo = acento, inactivo = card. No hay una paleta por tipo.
  - Prop `size?: "sm" | "md"` (default `"md"`): `"sm"` para los chips con avatar de PARA, `"md"` para las píldoras de TIPO.
  - Prop `leading?: ReactNode`: slot opcional para el avatar (usado en PARA).
  - Renderiza un `<button type="button">` con `aria-pressed` para el estado activo, reenviando `onClick`, `className`, `disabled` y `ref`.
- Nuevo archivo de datos `data/feed/mock-recipients.ts` con los 3 destinatarios del mockup (Mateo, Sofía, Benjamín): id, nombre, inicial y color de avatar.
- Nuevo archivo de datos `data/feed/mock-post-types.ts` con los 7 tipos de publicación del mockup, en el orden del mockup.
- Nuevo componente client `components/feed/NewPostModal.tsx` que renderiza el trigger y el modal:
  - Trigger: mismo markup y clases que el `<a href="#">` actual del sidebar (gradiente `#F4977E → #EE8164`, `+` de 17px, texto "Nueva publicación"), ahora como `<button type="button">`.
  - Modal con `<dialog>` + `showModal()`: top layer, focus trap, cierre con `Esc`, restauración del foco al trigger, scroll lock del `body` y del `<main>` scrollable, y reset del formulario al cerrar.
  - Card interna que replica el mockup: ancho máximo 580px, fondo `#FBF4EC`, borde `#ECE0D0`, radio 24px, sombra `0 20px 50px -24px rgba(63,54,46,.35)`, `overflow: hidden`.
  - Header: "Cancelar" (izquierda, `#94887B`, peso 700, 15px), título "Nueva publicación" (centro, Fredoka 600, 18px, `#3F362E`) y "Publicar" (derecha, `#D9583C`, peso 800, 15px), con separador inferior `#ECE0D0`.
  - Cuerpo con `padding: 24px 26px` y 4 secciones en este orden: **PARA**, **TIPO**, **DESCRIPCIÓN**, **FOTOS**.
  - **PARA**: fila de chips seleccionables (selección múltiple) con un `Badge` por niño (avatar circular de 26px con la inicial + nombre) y un chip "Toda la sala" al final. Todos los niños vienen seleccionados por defecto y "Toda la sala" se muestra activo mientras estén todos seleccionados.
  - **TIPO**: fila de 7 `Badge` (`size="md"`) con los tipos del mockup, de selección única.
  - **DESCRIPCIÓN**: `textarea` con placeholder "Contá cómo le fue hoy…", `min-height` 120px, `resize: vertical`, `padding: 14px 16px`, radio 14px, borde `1.5px #EADFD0`, fondo blanco, 15px, `line-height: 1.5`. Arranca vacía.
  - **FOTOS**: los 2 recuadros del mockup (recuadro con ícono de foto y recuadro punteado con `+` y "Agregar") dibujados como estáticos, **sin acción, sin `<input type="file">` y sin estado**.
  - Overlay claro: `::backdrop` con `rgba(63, 54, 46, 0.25)`, igual que los modales del SPEC 07 y SPEC 09.
  - Validación client-side al publicar: al menos un destinatario en PARA, un tipo en TIPO y una descripción no vacía. Los errores son inline, bajo cada sección, en `#D9583C` 13px, y el foco se mueve al primer elemento inválido.
  - "Publicar" con el formulario válido cierra el modal y descarta los datos: no crea ningún post, no modifica `mockPosts` y no persiste nada.
  - "Cancelar" y `Esc` cierran el modal sin validar. El click en el overlay no cierra.
  - Al cerrar se resetea el formulario: todos los destinatarios seleccionados de nuevo, sin tipo y sin descripción.
- Cambio en `components/layout/Sidebar.tsx`: el `<a href="#">` "Nueva publicación" se reemplaza por `<NewPostModal />`. El resto del sidebar queda igual.

**Fuera del alcance (para specs futuros):**

- Persistencia de la publicación: no se agrega nada a `mockPosts`, no hay `localStorage` ni backend. La publicación se descarta al cerrar.
- Subida real de imágenes: el bloque FOTOS es decorativo.
- Abrir el modal desde el composer del feed ("Compartí un momento…"): sigue siendo un link muerto con su propio spec.
- Editar una publicación existente (el link "Editar" de `Post.tsx`): sigue muerto.
- Migrar los badges de tipo del feed (`components/feed/Post.tsx`) al `Badge` nuevo: son otro patrón visual (badge con punto) y quedan como están.
- Cambiar el tipo `PostType` de `data/feed/mock-posts.ts` ("achievement" | "activity" | "announcement"): es otro dominio, no se toca.
- Mover el modal a `components/layout/`: vive en el dominio feed.
- Captura de Playwright y comparación visual contra el mockup.
- Cambios en los specs 01 a 09: quedan como registro histórico.

## Modelo de datos

```tsx
// components/common/ui/Badge.tsx
export type BadgeSize = "sm" | "md";

export interface BadgeProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  /** Active state: accent background with white text. Default false. */
  active?: boolean;
  /** "sm" for avatar chips, "md" for pills. Default "md". */
  size?: BadgeSize;
  type?: "button" | "submit";
  /** Optional leading element, e.g. the recipient avatar. */
  leading?: ReactNode;
  children: ReactNode;
}

// data/feed/mock-recipients.ts
export interface PostRecipient {
  id: string;
  name: string; // "Mateo"
  initial: string; // "M"
  avatarBackground: string; // "#A9D9E8"
  avatarText: string; // "#1F7A93"
}

// data/feed/mock-post-types.ts
export const mockPostTypes = [
  "Comida",
  "Siesta",
  "Actividad",
  "Logro",
  "Ánimo",
  "Foto",
  "Anuncio",
] as const;

export type MockPostType = (typeof mockPostTypes)[number];
```

Convenciones:

- El estado del formulario es local a `components/feed/NewPostModal.tsx` (`useState`), no global y no persistido:

  ```tsx
  interface NewPostFormState {
    recipientIds: string[]; // selected kid ids; all of them on open
    type: MockPostType | "";
    description: string;
  }

  type NewPostField = "recipients" | "type" | "description";
  type NewPostErrors = Partial<Record<NewPostField, string>>;
  ```

- El estado activo del chip "Toda la sala" es **derivado**: está activo si y solo si `recipientIds` contiene a todos los `mockRecipients`. No se guarda por separado, así que no puede quedar inconsistente.
- "Toda la sala" va al final de la lista de PARA, como en el mockup.
- El estado inicial es `{ recipientIds: mockRecipients.map(r => r.id), type: "", description: "" }`.
- `mockPosts` (`data/feed/mock-posts.ts`) y el tipo `Post` quedan sin cambios: el modal no crea posts.
- Los colores de avatar viven en el archivo de datos, no en el `@theme` de `app/globals.css`: son datos de la persona, no tokens del design system.

## Plan de implementación

1. Crear `components/common/ui/Badge.tsx` con `active`, `size` y `leading`. Colores: activo `bg-acento` + `text-white` + `border-acento`; inactivo `bg-card` + `text-nav` + `border-borde`. Tamaños: `"md"` = `px-4 py-2 rounded-full text-[13.5px] font-extrabold`; `"sm"` = `py-1.5 pl-1.5 pr-3.5 rounded-full text-[14px] font-bold` (el padding izquierdo cambia a `pl-1.5` cuando hay `leading`). Verificación: `npx tsc --noEmit` pasa.

2. Crear `data/feed/mock-recipients.ts` (Mateo `#A9D9E8`/`#1F7A93`, Sofía `#F4B8CC`/`#C44A7A`, Benjamín `#B9DEC4`/`#3E8B62`) y `data/feed/mock-post-types.ts` con los 7 tipos. Verificación: `npx tsc --noEmit` pasa y los dos archivos exportan los símbolos esperados.

3. Crear `components/feed/NewPostModal.tsx` con `"use client"`, un `ref` al `<dialog>`, un `ref` al trigger, el estado del formulario y de errores, el lock/unlock de scroll (mismo approach que `AddKidModal`: `body` + `closest("main")`) y los handlers `openModal` / `closeModal` / `handleClose` (reset + foco al trigger). Verificación: el componente compila.

4. Montar el `<dialog>` con la card del mockup: ancho máximo 580px (`w-[calc(100%-2rem)] max-w-145`), fondo `#FBF4EC`, borde `#ECE0D0`, radio 24px, sombra `0 20px 50px -24px rgba(63,54,46,.35)`, header con "Cancelar" (`CustomButton variant="cancel"`), título "Nueva publicación" y "Publicar" (`CustomButton variant="save"`), y cuerpo con `padding: 24px 26px`. El `<dialog>` lleva `aria-labelledby` apuntando al id del título. Verificación: el modal abre centrado, con overlay `rgba(63,54,46,0.25)` detrás.

5. Agregar la sección **PARA**: label 12px peso 800 `letter-spacing: .7px` `#94887B`, fila `flex flex-wrap gap-[9px]`, un `Badge size="sm"` por niño con `leading` = avatar (círculo de 26px, fondo del dato, inicial en Fredoka 600 13px) y el chip "Toda la sala" al final. El click de un niño lo alterna; el click de un niño seleccionado cuando estaban todos seleccionados deselecciona ese niño y apaga "Toda la sala"; el click de "Toda la sala" selecciona a todos si no estaban todos, y los deselecciona si estaban todos. Verificación: al abrir, los 3 niños y "Toda la sala" están activos.

6. Agregar la sección **TIPO**: label con el mismo estilo y fila `flex flex-wrap gap-[9px]` con 7 `Badge size="md"`; solo uno puede estar activo a la vez. Verificación: la fila se ve igual que el mockup, con un solo tipo activo.

7. Agregar la sección **DESCRIPCIÓN**: label "DESCRIPCIÓN" y `textarea` controlado con el placeholder "Contá cómo le fue hoy…" y los estilos del mockup. Verificación: el textarea arranca vacío.

8. Agregar la sección **FOTOS**: label "FOTOS" y los 2 recuadros de 96×96 del mockup (el primero con `ImagePlaceholderIcon` de 26px en `#CBB89F`, el segundo punteado con `+` de 22px en `#C5503A` y el texto "Agregar" de 12px), ambos como `div` sin handler. Verificación: los recuadros se ven pero no hacen nada.

9. Implementar la validación en el submit: sin destinatarios → "Elegí al menos un destinatario" bajo PARA; sin tipo → "Elegí un tipo" bajo TIPO; descripción vacía tras `trim()` → "Este campo es obligatorio" bajo DESCRIPCIÓN. El modal no cierra y el foco va al primer elemento inválido. Verificación: al publicar vacío se ven 3 errores y el modal sigue abierto.

10. Implementar el cierre: "Cancelar" y `Esc` cierran sin validar, el click en el overlay no cierra, y "Publicar" cierra solo si no hay errores. En el evento `close` se resetea el formulario (destinatarios vuelven a ser todos, sin tipo, descripción vacía), se restaura el scroll y el foco vuelve al trigger. Verificación: abrir, cerrar y reabrir muestra el modal como en la primera apertura.

11. En `components/layout/Sidebar.tsx`, reemplazar el `<a href="#">` "Nueva publicación" por `<NewPostModal />`, conservando el markup y las clases actuales del botón. Verificación: el sidebar se ve idéntico y el botón abre el modal.

12. Correr `npm run lint`, `npx tsc --noEmit`, `npm run build` y `node scripts/canonical-classes.mjs`. Verificación: los cuatro pasan sin errores ni clases no canónicas nuevas.

## Criterios de aceptación

- [x] `npm run build`, `npm run lint`, `npx tsc --noEmit` y `node scripts/canonical-classes.mjs` pasan sin errores.
- [x] Existe `components/common/ui/Badge.tsx` con las props `active`, `size` y `leading`, y renderiza un `<button type="button">` con `aria-pressed` igual a `active`.
- [x] El `Badge` activo usa fondo acento `#D9583C` y texto blanco; el inactivo usa fondo `#FFFDF9`, borde `#ECE0D0` y texto `#6E6359`.
- [x] El `Badge` tiene un solo par de colores: los 7 tipos de TIPO comparten el mismo estilo activo e inactivo, sin una paleta por tipo.
- [x] `Badge size="md"` se ve como una píldora (`padding: 8px 16px`, radio 999px, peso 800, 13.5px) y `Badge size="sm"` como un chip con avatar (`padding: 6px 14px 6px 6px`, peso 700, 14px).
- [x] El botón "Nueva publicación" del sidebar abre el modal y conserva el gradiente `#F4977E → #EE8164`, el ícono `+` de 17px, la sombra `0 8px 18px -8px rgba(238,129,100,0.75)` y el texto del mockup.
- [x] El modal aparece centrado con overlay `rgba(63, 54, 46, 0.25)` detrás.
- [x] La card mide como máximo 580px de ancho, con fondo `#FBF4EC`, borde `#ECE0D0`, radio 24px y sombra `0 20px 50px -24px rgba(63,54,46,.35)`.
- [x] El header muestra "Cancelar" a la izquierda (`#94887B`, peso 700, 15px), "Nueva publicación" al centro (Fredoka 600, 18px, `#3F362E`) y "Publicar" a la derecha (`#D9583C`, peso 800, 15px), con separador inferior `#ECE0D0`.
- [x] El cuerpo tiene `padding: 24px 26px` y las 4 secciones en el orden PARA, TIPO, DESCRIPCIÓN, FOTOS, con labels de 12px peso 800, `letter-spacing: .7px`, `#94887B`.
- [x] PARA muestra un chip por destinatario de `data/feed/mock-recipients.ts` (avatar circular de 26px con la inicial y el nombre) más el chip "Toda la sala" al final.
- [x] Al abrir el modal, los 3 niños y "Toda la sala" están seleccionados (activos).
- [x] La selección de PARA es múltiple: se pueden activar y desactivar niños de a uno.
- [x] Al desactivar un niño, el chip "Toda la sala" se apaga; al activar todos los niños a mano, "Toda la sala" vuelve a encenderse.
- [x] Al hacer click en "Toda la sala" con todos los niños seleccionados, se deseleccionan todos; al hacer click con alguno deseleccionado, se seleccionan todos.
- [x] TIPO muestra 7 opciones: Comida, Siesta, Actividad, Logro, Ánimo, Foto y Anuncio, en ese orden.
- [x] La selección de TIPO es única: activar un tipo desactiva el anterior.
- [x] DESCRIPCIÓN es un `textarea` con placeholder "Contá cómo le fue hoy…", `min-height` 120px, `resize: vertical`, `padding: 14px 16px`, radio 14px, borde `1.5px #EADFD0` y fondo blanco; al abrir está vacío.
- [x] FOTOS muestra los 2 recuadros de 96×96 del mockup (ícono de foto y recuadro punteado con `+` y "Agregar") y ninguno tiene acción ni sube archivos.
- [x] "Publicar" sin destinatario no cierra el modal y muestra "Elegí al menos un destinatario" bajo PARA.
- [x] "Publicar" sin tipo no cierra el modal y muestra "Elegí un tipo" bajo TIPO.
- [x] "Publicar" con la descripción vacía o solo con espacios no cierra el modal y muestra "Este campo es obligatorio" bajo DESCRIPCIÓN.
- [x] Al publicar con errores, el foco queda en el primer elemento inválido.
- [x] "Publicar" con el formulario válido cierra el modal y no crea ni modifica ningún post en el feed.
- [x] "Cancelar" cierra el modal sin validar; `Esc` también lo cierra.
- [x] Un click en el overlay no cierra el modal.
- [x] Al reabrir el modal, los 3 niños y "Toda la sala" están seleccionados de nuevo, TIPO no tiene ninguno activo y la descripción está vacía.
- [x] Mientras el modal está abierto, el `body` y el `<main>` no scrollean; al cerrar, vuelven a scrollear con normalidad.
- [x] Al abrir, el foco cae en el primer chip de destinatario; al cerrar, el foco vuelve al botón "Nueva publicación".
- [x] El `<dialog>` tiene `aria-labelledby` apuntando al título "Nueva publicación".
- [x] En viewports < `lg` el modal no tiene scroll horizontal: ancho `calc(100% - 2rem)` con tope de 580px (`max-w-145`), y el contenido largo hace scroll vertical dentro del modal.
- [x] `data/feed/mock-posts.ts` y el tipo `Post` quedan sin cambios.
- [x] `components/layout/Sidebar.tsx` conserva el resto de su markup, clases y links muertos.

## Decisiones

- **Sí:** `Badge` con un único par de colores (activo acento, inactivo card) y sin paleta por tipo. Es la decisión del usuario: "un estilo único para dos estados, un color activo y otro inactivo, elegido de la paleta del proyecto, sin múltiples colores". Evita además un mapa de 7 colores que luego hay que mantener.
- **Sí:** `Badge` reutilizado en PARA y TIPO. Un solo componente para los dos grupos de opciones; lo que cambia entre filas es el `size` y el `leading` (avatar).
- **Sí:** desviación consciente del mockup en PARA: el chip activo usa el acento `#D9583C` en lugar de la tinta `#3F362E` del mockup. Consecuencia de usar un único par de colores en todo el modal.
- **No:** un `Badge` por tipo de publicación con colores propios. El usuario pidió explícitamente un solo color activo y uno inactivo.
- **No:** reutilizar `CustomButton variant="chip"` para TIPO. El `chip` existente es de selección única con `aria-pressed` y otro aspecto (fondo `#CCD8F4`); el `Badge` tiene su propio par de colores y sirve para los dos grupos.
- **Sí:** "Toda la sala" con estado derivado (activo ⇔ todos los niños seleccionados) en vez de un flag aparte. Con un flag independiente es fácil quedar en un estado inconsistente (la sala activa con un niño deseleccionado).
- **Sí:** el click en "Toda la sala" alterna entre seleccionar a todos y deseleccionar a todos. Es el comportamiento estándar de un "seleccionar todo" y evita un chip que no hace nada visible.
- **Sí:** al abrir el modal, todos los destinatarios vienen seleccionados y "Toda la sala" activa. Es el estado por defecto que pidió el usuario y el que corresponde a una publicación de sala.
- **Sí:** los destinatarios viven en `data/feed/mock-recipients.ts` y no en `data/kids/mock-kids.ts`. El feed no debe depender del dominio de niños, y el mockup muestra 3 niños con avatares que el modelo de niños no tiene (color de avatar).
- **Sí:** la selección de TIPO es única. Una publicación tiene un tipo.
- **Sí:** la descripción es obligatoria (sin espacios) y el texto del mockup queda como placeholder. El mockup traía un texto de ejemplo precargado; precargar contenido en un formulario real confunde.
- **Sí:** la validación corre al publicar, no en vivo. Misma línea que el SPEC 07 y el SPEC 09.
- **Sí:** los errores son inline, bajo cada sección, en `#D9583C` 13px, y el foco va al primer elemento inválido.
- **Sí:** FOTOS se dibuja pero no hace nada. El usuario pidió explícitamente un espacio vacío sin funcionalidad; se conserva el aspecto del mockup sin handlers ni `<input type="file">`.
- **Sí:** "Publicar" valida y cierra, sin efecto sobre los datos. Sin backend, un CTA que "publica" algo que se pierde al recargar sería UI falsa, la misma línea que siguió el repo en el SPEC 07 y el SPEC 09.
- **No:** agregar el post al feed en memoria. Se descartaría al recargar y obligaría a mover el estado de la lista a un client component.
- **Sí:** `<dialog>` nativo con `showModal()`, reutilizando el patrón del SPEC 07 y el SPEC 09. Aporta top layer, focus trap, `Esc` y restauración del foco sin dependencias, y el repo no tiene librerías de UI.
- **Sí:** overlay claro `rgba(63,54,46,0.25)`, el mismo de los otros modales del repo.
- **No:** cerrar con click en el overlay. Evita perder lo tipeado por un click accidental; el mockup tampoco sugiere esa interacción.
- **Sí:** el trigger y el modal viven en el mismo componente client `components/feed/NewPostModal.tsx`, y el sidebar monta `<NewPostModal />`. El trigger necesita el `ref` del `<dialog>` para abrirlo y recuperar el foco al cerrar.
- **Sí:** el scroll lock busca el contenedor con `dialogRef.current?.closest("main") ?? document.querySelector("main")`. El trigger vive en el `<aside>` del sidebar, que es hermano del `<main>` (ver `app/(app)/layout.tsx`), así que `closest("main")` devuelve `null` y sin el fallback el feed seguiría scrolleando con el modal abierto.
- **Sí:** el trigger conserva las clases actuales del sidebar (no se migra a `CustomButton variant="primary"`), porque las del sidebar (`w-full p-3 rounded-2xl`) no coinciden con las de `CustomButton` (`px-4.5 py-2.75 rounded-[14px]`).
- **No:** agregar tokens al `@theme` de `app/globals.css` para este modal. Los colores usados (`acento`, `card`, `borde`, `nav`, `foto-fondo`, `foto-borde`, `foto-tinta`) ya existen; solo `#CBB89F` y los colores de avatar quedan como valores sueltos, los primeros dentro de la clase del ícono y los segundos en el archivo de datos.
- **No:** migrar los badges de tipo del `Post.tsx` al `Badge` nuevo. Son otro patrón visual (badge con punto de color) y no fueron pedidos.
- **No:** tocar `data/feed/mock-posts.ts` ni el tipo `PostType`. El modal no crea posts.

## Riesgos

| Riesgo                                                                                                        | Mitigación                                                                                                    |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| El `<dialog>` trae estilos por defecto del navegador (padding, borde, fondo blanco, `max-width` calculado).     | Resetear con clases (`p-0 border-0 bg-transparent`) y fijar el ancho a mano, como en `AddKidModal`.              |
| El ancho por defecto del `<dialog>` modal lo deja a `calc(100% - 6px - 2em)`, con padding extra.                | Definir el ancho explícitamente con `w-[calc(100%-2rem)] max-w-[580px]`.                                        |
| El scroll lock del `body` no es nativo de `<dialog>`; si no se restaura, el feed queda sin scroll.               | Bloquear al abrir y restaurar en el evento `close`, que también dispara `Esc` y "Cancelar".                      |
| `showModal()` sobre un dialog ya abierto lanza `InvalidStateError`.                                           | Guardar con `if (!dialog.open)` antes de llamar `showModal()`.                                                 |
| El `Badge` se usa en dos filas con formas distintas (píldora y chip con avatar) y una única clase base.        | La forma la resuelve la prop `size`; el padding izquierdo se calcula según exista `leading`.                     |
| Un solo par de colores hace que los chips de PARA se vean distintos del mockup (activo acento en vez de tinta). | Decisión explícita del usuario; documentada en Decisiones y visible en los criterios de aceptación.             |
| La descripción obligatoria podría frenar publicaciones que el usuario considera válidas con un texto corto.       | La validación solo trimea: cualquier texto con al menos un carácter no vacío pasa.                               |

## Qué NO está en este spec

- Persistencia de la publicación, backend, API y creación real de posts en `mockPosts`.
- Subida de imágenes: el bloque FOTOS es decorativo.
- Abrir el modal desde el composer del feed o editar un post existente.
- Migrar los badges de tipo de `components/feed/Post.tsx` al `Badge` nuevo.
- Cambios en `data/feed/mock-posts.ts` o en el tipo `PostType`.
- Un `CustomSelect`, `CustomTextarea` o `CustomCheckbox` genérico.
- Captura de Playwright y comparación visual contra el mockup.
- Cambios a los specs 01 a 09.

Cada una de esas, si aterriza, va en su propio spec.
