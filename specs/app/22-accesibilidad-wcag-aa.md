# SPEC 22 — Accesibilidad WCAG 2.2 AA (contraste, foco, nombres y semántica)

> **Estado:** Approved
> **Depende de:** SPEC 05 (login), SPEC 06 (register), SPEC 07 (modal de alta de niño), SPEC 08 (componentes UI), SPEC 09 (modal vincular padre), SPEC 10 (modal nueva publicación), SPEC 21 (stores de salas y sesión)
> **Fecha:** 2026-11-04
> **Ubicación:** `specs/app/22-accesibilidad-wcag-aa.md` (spec de app: no cambia el esquema de la base)
> **Objetivo:** Dejar las siete pantallas que hoy existen en nivel WCAG 2.2 AA, corrigiendo el contraste de la paleta, el indicador de foco, los nombres accesibles de los controles y la asociación de los mensajes de error con sus campos.

## Por qué existe este spec

El repo nunca tuvo una revisión de accesibilidad. La paleta se copió del mockup (`references/pantallas/*.dc.html`) tal cual, y varios de sus tokens no llegan al contraste mínimo que WCAG 2.2 AA exige. La auditoría que motivó este spec (axe-core 4.10 sobre el dev server, más una revisión manual de teclado) encontró **60 nodos con violación WCAG A/AA en siete superficies**, y ninguno de ellos es un problema de arquitectura: son tokens de color mal elegidos, tres atributos de foco y semántica, y cuatro asociaciones de error.

Lo que ya funciona no se toca: los tres modales usan `<dialog>` nativo con `showModal()`, y se verificó que el foco queda atrapado dentro del diálogo, que `Escape` lo cierra y que el foco vuelve al botón disparador. Los checkboxes tienen label implícito, los `<img>` no existen (todo es SVG), `lang="es"` está en el `<html>` y los formularios tienen `<label for>` real. Ninguna de esas cosas se modifica.

El punto de este spec es que las correcciones sean **verificables por máquina**, no por opinión. Por eso incluye `scripts/a11y-audit.mjs`: un script que corre axe-core sobre las siete pantallas con una sesión real y falla con exit code 1 si queda una sola violación A/AA. Los criterios de aceptación son el output de ese script.

## Alcance

**En:**

- `app/globals.css`: retocar los tokens de `@theme` que no llegan a 4.5:1, reemplazar `input:focus { outline: none; }` por un anillo `:focus-visible` global, corregir `::placeholder` y agregar el bloque `prefers-reduced-motion`.
- Los gradientes y colores sueltos que están escritos en hexadecimal dentro de los componentes, en los siete archivos donde aparecen.
- `components/common/ui/CustomInput.tsx`: asociar el mensaje de error con su input (`aria-describedby`), marcar el error como `role="alert"` y renderizar un `<label>` visualmente oculto cuando la variante es `bare`.
- `components/common/ui/CustomButton.tsx`: llevar las variantes `cancel` y `save` a 24px de alto mínimo.
- `components/common/icons/Icons.tsx` y `components/common/avatars/Avatar.tsx`: marcar los SVG decorativos con `aria-hidden="true"` y `focusable="false"`.
- `app/(app)/layout.tsx`: skip link al contenido y `id` + `tabIndex` en el `<main>`.
- `app/login/page.tsx` y `app/register/page.tsx`: landmark `<main>`.
- `components/feed/Post.tsx`: nombre accesible del link de comentarios y `fill="currentColor"` en `HeartIcon`.
- `components/feed/NewPostModal.tsx`, `components/kids/AddKidModal.tsx`, `components/kids/LinkParentModal.tsx`, `components/login/LoginForm.tsx`: asociación de errores con sus campos y `role="alert"`.
- `components/layout/Sidebar.tsx`: nombre accesible explícito en el botón de logout.
- `scripts/a11y-audit.mjs` (nuevo) y las devDependencies `playwright` y `axe-core` que necesita.

**Fuera del alcance (para specs futuros):**

- Navegación en mobile. El `<aside>` es `hidden lg:flex`, así que a 390px no hay forma de llegar a `/kids` desde el feed. Es un problema real de accesibilidad móvil, pero es una pantalla nueva, no una corrección: va en su propio spec.
- Las pantallas que todavía no existen (`/avisos`, `/mi-cuenta`, la vista de resumen del día, el detalle de publicación). Se corrigen cuando se construyan.
- Los `href="#"` de `components/kids/KidProfile.tsx` ("Editar" y "Resumen del día"), que apuntan a features inexistentes.
- WCAG AAA: `prefers-contrast`, contrasteEnhanced (7:1), y todo lo que la skill de accesibilidad lista como "nice to have".
- Cambiar `<dialog>` nativo por un diálogo implementado a mano. El nativo ya cumple el focus trap.
- Una auditoría con lector de pantalla real (NVDA, VoiceOver). Este spec se verifica con axe-core y con teclado; la revisión con lector de pantalla es manual y queda para la QA del equipo.
- Cambiar la paleta más allá de lo que la tabla de este spec lista. Si un token ya pasa, no se toca.

## Modelo de datos

Este spec no introduce estructuras de datos nuevas. No hay migraciones, ni cambios de esquema, ni estado nuevo: todo es CSS, props de componentes y atributos ARIA.

### Tokens de `@theme` retocados

Los valores de la columna "Nuevo" están verificados contra el fondo real donde se usa cada token. La columna "Sobre" lista los fondos contra los que se midió.

| Token                       | Actual    | Nuevo     | Sobre                                                   | Mínimo |
| --------------------------- | --------- | --------- | ------------------------------------------------------- | ------ |
| `--color-placeholder`       | `#a89a8b` | `#716454` | card 5.66 · fondo 4.92 · modal 5.27 · acento-claro 4.68 | 4.5    |
| `--color-mute`              | `#94887b` | `#6b6055` | card 6.03 · fondo 5.24 · modal 5.61                     | 4.5    |
| `--color-nav`               | `#6e6359` | `#5f564c` | card 7.07 · fondo 6.15 · modal 6.59                     | 4.5    |
| `--color-acento`            | `#d9583c` | `#b34428` | card 5.48 · fondo 4.76 · modal 5.10 · acento-claro 4.53 | 4.5    |
| `--color-acento-editar`     | `#c5503a` | `#a83e25` | card 6.11 · fondo 5.32 · modal 5.70 · foto-fondo 5.30   | 4.5    |
| `--color-corazon`           | `#e0654a` | `#c14a30` | card 4.82                                               | 4.5    |
| `--color-logro`             | `#3e9b6c` | `#2a6b48` | logro-fondo 5.02                                        | 4.5    |
| `--color-actividad`         | `#2e89a6` | `#1f6a83` | actividad-fondo 4.68                                    | 4.5    |
| `--color-anuncio`           | `#4e72c8` | `#3a5aa8` | anuncio-fondo 4.58 · card 6.44                          | 4.5    |
| `--color-avatar-usuario`    | `#f2937a` | `#b34428` | blanco encima 5.56                                      | 4.5    |
| `--color-avatar-nino-tinta` | `#1f7a93` | `#126075` | avatar-nino 4.66                                        | 4.5    |
| `--color-boton-top`         | `#f4977e` | `#b34c28` | blanco encima 5.27                                      | 4.5    |
| `--color-boton-bottom`      | `#ee8164` | `#a83e25` | blanco encima 6.11                                      | 4.5    |

`--color-nav` baja a `#5f564c` aunque hoy ya pasa el contraste: hace falta para que la jerarquía de grises siga siendo tres niveles distintos y legibles (`placeholder` < `mute` < `nav`). Sin ese cambio, `mute` y `nav` quedarían visualmente indistinguibles.

### Colores sueltos dentro de los componentes

| Hex actual | Dónde                                                                    | Nuevo     | Sobre                       | Mínimo |
| ---------- | ------------------------------------------------------------------------ | --------- | --------------------------- | ------ |
| `#8A7C6D`  | `app/(app)/page.tsx:13`, `components/kids/KidProfile.tsx:114`            | `#716454` | card 5.66 · fondo 4.92      | 4.5    |
| `#D9684A`  | `components/kids/KidCard.tsx:25`, `components/kids/KidProfile.tsx:77`    | `#a33f27` | `#fbd8cc` 4.79              | 4.5    |
| `#A88526`  | `components/kids/LinkParentModal.tsx:232,238`                            | `#7d5f18` | `#fbf1d6` 5.30              | 4.5    |
| `#B0A290`  | `components/common/icons/Icons.tsx:189` (SearchIcon)                     | `#716454` | card 5.66                   | 3.0    |
| `#CBB89F`  | `components/kids/KidCard.tsx:29`, `components/feed/NewPostModal.tsx:274` | `#9c8b76` | card 3.25 · foto-fondo 3.03 | 3.0    |
| `#B6A99B`  | `app/globals.css` (`::placeholder`)                                      | `#716454` | blanco 5.75                 | 4.5    |

### Gradientes

| Gradiente                                                               | Actual                           | Nuevo               | Sobre                                                            | Mínimo |
| ----------------------------------------------------------------------- | -------------------------------- | ------------------- | ---------------------------------------------------------------- | ------ |
| Botón primario (`CustomButton` `PRIMARY_MD_CLASS` y `PRIMARY_LG_CLASS`) | `#F4977E → #EE8164`              | `#B34C28 → #A83E25` | blanco 5.27 → 6.11                                               | 4.5    |
| Botón "Nueva publicación" (`NewPostModal.tsx:156`)                      | `from-boton-top to-boton-bottom` | tokens nuevos       | blanco 5.27 → 6.11                                               | 4.5    |
| Panel de login (`LoginPanel.tsx:8`)                                     | `#F6A98E → #F2937A → #EC7E62`    | `#B34C28 → #A83E25` | blanco 5.27 → 6.11 · `text-white/92` 4.73 · `text-white/90` 4.59 | 4.5    |

El panel de login es el único gradiente donde el texto tiene que cambiar de color: hoy el blanco sobre coral da 1.91 a 2.72. Con el gradiente nuevo el blanco pasa, y `text-white/92` y `text-white/90` también quedan por encima de 4.5 sin tocarlos.

Los shaders `rgba(238,129,100,...)` de las sombras de los botones pasan a `rgba(179,76,40,...)` para acompañar al nuevo coral. Las sombras no tienen requisito de contraste.

### Anillo de foco

Un único anillo global, en `app/globals.css`:

```css
:focus-visible {
  outline: 2px solid var(--color-acento);
  outline-offset: 2px;
}
```

`outline-offset: 2px` saca el anillo del control, así que en los botones primarios (fondo `#b34c28`) el anillo queda sobre el fondo de la página, donde `#b34428` da 4.76 contra `#f6ecdf` y 5.48 contra `#fffdf9`. Un anillo del mismo color del botón sería invisible.

## Plan de implementación

1. En `app/globals.css`, retocar los trece tokens de la tabla de `@theme`. Verificar en `/login` que los labels "EMAIL" y "CONTRASEÑA" y el subtítulo "Ingresá para ver el día de hoy." cambian de tono pero no de posición.

2. En el mismo archivo, corregir `::placeholder` a `#716454` y reemplazar el bloque `input:focus { outline: none; }` por el `:focus-visible` global del spec. Verificar que un input enfocado muestra un anillo de 2px coral con 2px de separación, y que el botón "Iniciar sesión" muestra el anillo **fuera** del gradiente.

3. En el mismo archivo, agregar el bloque `@media (prefers-reduced-motion: reduce)` que anula `animation-duration`, `animation-iteration-count`, `transition-duration` y `scroll-behavior`. Verificar que el `Skeleton` de carga deja de pulsar.

4. En `components/common/ui/CustomButton.tsx`, cambiar `PRIMARY_MD_CLASS` y `PRIMARY_LG_CLASS` para usar el gradiente `#B34C28 → #A83E25` y actualizar el `rgba(238,129,100,...)` de las sombras a `rgba(179,76,40,...)`. Agregar `min-h-6` (24px) a `CANCEL_CLASS` y `SAVE_CLASS`. Verificar en el modal de nueva publicación que "Cancelar" y "Publicar" miden 24px o más de alto.

5. En `components/login/LoginPanel.tsx`, cambiar el gradiente del panel a `#B34C28 → #A83E25`. Verificar que el título y el párrafo del panel quedan legibles sobre el coral oscuro.

6. En `components/common/ui/CustomInput.tsx`, derivar un `errorId` a partir del `id` del input (`${id}-error`), ponerlo en el `aria-describedby` del input cuando hay error, y darle `id` y `role="alert"` al `<p>` del error. En la variante `bare`, renderizar el `<label>` con la clase `sr-only` cuando se pase la prop `label`. Verificar en el modal de alta de niño que el mensaje "Este campo es obligatorio" se anuncia y que el input lo referencia.

7. En `components/kids/KidsList.tsx`, pasar `label="Buscar niño"` al `CustomInput` del buscador. Verificar que el input ahora tiene un label programático y no solo el placeholder.

8. En `components/kids/AddKidModal.tsx`, agregar `aria-describedby` al `<select>` de SALA y al `<textarea>` de NOTAS MÉDICAS apuntando a sus `<p>` de error, y `role="alert"` a esos `<p>`. El error de SALA conserva su `id` derivado de `add-kid-room`.

9. En `components/feed/NewPostModal.tsx`, dar `id` y `role="alert"` a los tres `<p>` de error, y `aria-describedby` a la `<textarea>` de descripción y a los dos `role="group"` de destinatarios y de tipo. Verificar que al enviar el formulario vacío los tres mensajes se anuncian.

10. En `components/kids/LinkParentModal.tsx`, dar `id` y `role="alert"` a los `<p>` de error de nombre y email, y envolver los tres chips de parentesco en un `role="group"` con `aria-label="Parentesco"`.

11. En `components/login/LoginForm.tsx`, dar `role="alert"` al `<p>` de error de login y `aria-invalid` a los dos inputs cuando hay error.

12. En `components/common/icons/Icons.tsx`, agregar `aria-hidden="true"` y `focusable="false"` a los diecisiete `<svg>`. En `components/common/avatars/Avatar.tsx`, lo mismo en su `<svg>`.

13. En `components/common/icons/Icons.tsx`, cambiar el `fill="#E0654A"` de `HeartIcon` por `fill="currentColor"`, para que herede el `text-corazon` del contenedor. En `components/feed/Post.tsx`, agregar `aria-label={`${post.comments} comentarios`}` al link de comentarios y `aria-hidden="true"` al `CommentIcon`.

14. En `components/layout/Sidebar.tsx`, agregar `aria-label="Cerrar sesión"` al botón de logout, conservando el `title` para el tooltip.

15. En `app/(app)/layout.tsx`, agregar el skip link como primer elemento enfocable y poner `id="contenido"` y `tabIndex={-1}` en el `<main>`.

16. En `app/login/page.tsx` y `app/register/page.tsx`, envolver el contenido principal en un `<main>`.

17. En `components/feed/Composer.tsx`, `components/feed/Post.tsx` y `components/layout/Sidebar.tsx`, reemplazar los `<a href="#">` por `<button type="button" disabled>`, para que no se anuncien como enlaces con destino.

18. Crear `scripts/a11y-audit.mjs` y agregar `playwright` y `axe-core` a `devDependencies`. Verificar: `node scripts/a11y-audit.mjs` corre las siete superficies y sale con código 1 si hay violaciones.

19. Correr `npm run lint` y `npx tsc --noEmit`.

## Criterios de aceptación

- [ ] `node scripts/a11y-audit.mjs` reporta **0 violaciones** WCAG A/AA en las siete superficies: `/login`, `/register`, `/`, `/kids`, `/kids/[id]`, el modal de nueva publicación (con y sin errores visibles) y el modal de alta de niño (con y sin errores visibles).
- [ ] `node scripts/a11y-audit.mjs` sale con código de salida 0.
- [ ] Todos los tokens de la tabla de `@theme` tienen el valor nuevo en `app/globals.css`.
- [ ] Los seis colores sueltos de la tabla de "Colores sueltos" tienen el valor nuevo en sus archivos.
- [ ] El gradiente del botón primario, el del botón "Nueva publicación" y el del panel de login usan `#B34C28 → #A83E25`.
- [ ] Ningún texto visible del app tiene contraste menor a 4.5:1 contra su fondo, y ningún ícono con significado tiene contraste menor a 3:1.
- [ ] Un input enfocado muestra un anillo de foco visible de 2px coral con 2px de separación; el anillo no queda oculto sobre el fondo del botón.
- [ ] El primer elemento enfocable de `/`, `/kids` y `/kids/[id]` es un link "Saltar al contenido" que lleva al `<main>`.
- [ ] El buscador de `/kids` tiene un label programático (`<label>` con `sr-only`), no solo un placeholder.
- [ ] Al enviar el modal de alta de niño vacío, el mensaje de error de cada campo es referenciado por el `aria-describedby` de su input y tiene `role="alert"`.
- [ ] Al enviar la nueva publicación vacía, los tres mensajes de error tienen `role="alert"` y están asociados a su control.
- [ ] El link de comentarios de una publicación expone un nombre accesible con la cantidad de comentarios, no solo el número.
- [ ] Todos los SVG decorativos de `Icons.tsx` y `Avatar.tsx` tienen `aria-hidden="true"`.
- [ ] Los botones "Cancelar" y "Publicar" miden 24px o más de alto.
- [ ] `/login` y `/register` tienen un landmark `<main>`.
- [ ] Con `prefers-reduced-motion: reduce`, el `Skeleton` deja de pulsar y las transiciones de hover se anulan.
- [ ] `npm run lint` y `npx tsc --noEmit` terminan sin errores.

## Decisiones

- **Sí:** retocar los tokens conservando el tono, en vez de rediseñar la paleta. El mockup es la especificación visual del producto y el coral cálido se mantiene reconocible; lo que cambia es la luminosidad. La alternativa (dejar los colores y aceptar el incumplimiento) documentaba 60 nodos con violación WCAG AA.
- **Sí:** oscurecer el gradiente del botón primario y conservar el texto blanco, en vez de mantener el coral `#F4977E → #EE8164` e invertir el texto a `#392f28`. El texto blanco es lo que pide el mockup y lo que espera el usuario; invertir el color del texto de todos los botones primarios es un cambio visual más invasivo.
- **Sí:** incluir `/kids/[id]` en el alcance, que no estaba en la lista inicial de seis superficies. La ruta ya existe, es alcanzable desde `/kids` y tenía 11 violaciones WCAG AA propias. Dejar una pantalla real sin auditar contradice el objetivo del spec.
- **Sí:** bajar `--color-nav` a `#5f564c` aunque ya pase el contraste. Sin ese ajuste, `mute` y `nav` quedan en el mismo tono y se pierde la jerarquía de tres niveles que el mockup define.
- **Sí:** un anillo `:focus-visible` global en `globals.css` en vez de uno por componente. Es el mismo control en toda la app y el repo ya tiene un solo lugar para estilos base.
- **Sí:** `outline-offset: 2px` en el anillo. Sin offset, el anillo del botón primario queda sobre el gradiente y es invisible.
- **Sí:** `aria-describedby` con un id derivado del `id` del campo (`${id}-error`) en lugar de ids sueltos. El `id` del campo ya existe y es único; derivar el del error evita tener que mantener dos ids sincronizados a mano.
- **Sí:** `role="alert"` en los `<p>` de error. El mensaje aparece después de la acción del usuario, y sin `role="alert"` un lector de pantalla no lo anuncia.
- **Sí:** un `<label>` con `sr-only` en el buscador de `/kids` en vez de un `aria-label`. El criterio 3.3.2 pide que la etiqueta sea visible; un `aria-label` resuelve el nombre accesible pero no la etiqueta visible, y un `<label>` oculto por CSS sigue siendo la técnica H44 del W3C.
- **Sí:** reemplazar los `<a href="#">` por `<button type="button" disabled>`. Un enlace sin destino se anuncia como enlace y lleva a ninguna parte; un botón deshabilitado no se anuncia como destino posible.
- **No:** cambiar `<dialog>` nativo por un diálogo propio. El nativo ya da focus trap, `Escape` y retorno del foco al disparador, verificado con Playwright.
- **No:** agregar un `<label>` visible al buscador. El mockup no lo tiene y el espacio es de una sola línea.
- **No:** agregar un `role="radiogroup"` a los chips de parentesco de `LinkParentModal`. Un radiogroup exige navegación con flechas entre opciones, que es trabajo propio; mientras tanto `aria-pressed` sobre botones comunica el estado sin mentir.
- **No:** usar `aria-hidden="true"` en el `SunIcon` del panel de login sin revisar su rol. El ícono acompaña al nombre de la marca escrito al lado, así que es decorativo y queda oculto.
- **No:** implementar el grupo de destinatarios de `NewPostModal` como `fieldset`/`legend`. Los badges son botones con `aria-pressed` dentro de un `role="group"` con `aria-label`, que ya comunica el grupo y el estado de cada opción.
- **No:** agregar `prefers-contrast`. Es una mejora sobre AA y no es un incumplimiento.

## Riesgos

| Riesgo                                                                                                        | Mitigación                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Retocar la paleta cambia el aspecto del producto respecto del mockup, y el mockup es la especificación visual | El cambio es de luminosidad, no de tono: el coral sigue siendo coral. Los valores de la tabla de `@theme` son la referencia única; si un mockup se rehace, se re-derivan desde ahí          |
| El gradiente del panel de login y el del botón primario quedan con el mismo coral y se confunden              | Hoy también son el mismo color. La diferencia actual es de saturación y no se pierde                                                                                                        |
| Un anillo `:focus-visible` global puede quedar tapado por un `overflow: hidden` en un contenedor              | Verificar en el pase manual de teclado que el anillo del buscador y el del primer campo de cada modal se ven completos                                                                      |
| `axe-core` no cubre todos los criterios de WCAG                                                               | Un score de 100 no es conformidad WCAG. El pase manual de teclado y la revisión con lector de pantalla quedan como QA del equipo, y este spec lo dice explícitamente                        |
| `scripts/a11y-audit.mjs` depende de la sesión de prueba y del dev server                                      | El script falla con un mensaje explícito si no encuentra el dev server en `http://localhost:3000` o si no puede iniciar sesión, en vez de reportar "0 violaciones" sobre una pantalla vacía |
| Agregar `playwright` como devDependency instala un browser de ~150MB                                          | El browser se descarga una sola vez. Si el equipo no lo quiere, el criterio de aceptación se cumple igual corriendo axe-core a mano                                                         |

## Lo que **no** entra en este spec

- Navegación en mobile (el `<aside>` es `hidden lg:flex` y a 390px no hay forma de llegar a `/kids`).
- Las pantallas que no existen todavía: `/avisos`, `/mi-cuenta`, resumen del día, detalle de publicación.
- Los `href="#"` de `components/kids/KidProfile.tsx`.
- WCAG AAA: `prefers-contrast`, contrasteEnhanced, todo lo que la skill lista como "nice to have".
- Una auditoría con lector de pantalla real (NVDA, VoiceOver).
- Cambios de esquema, migraciones o seeds.
- Rehacer el mockup de ninguna pantalla.
