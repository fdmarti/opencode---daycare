# SPEC 07 — Modal de alta de niño (`/kids`)

> **Estado:** Approved
> **Depende de:** SPEC 02 (estructura de carpetas), SPEC 03 (listado de niños y botón "Agregar niño")
> **Fecha:** 2026-10-30
> **Objetivo:** Implementar el modal de alta de niño de `references/pantallas/agregar-nino.dc.html`, que se abre desde el botón "Agregar niño" de `/kids` y valida nombre, fecha de nacimiento y sala.

## Alcance

**En:**

- Componente client `components/kids/AddKidModal.tsx` que renderiza el trigger "Agregar niño" (mismo markup, gradiente, ícono `+` y sombra que el `<a href="#">` actual) y el modal.
- Modal implementado con el elemento nativo `<dialog>` + `showModal()`: top layer, focus trap, cierre con `Esc` y restauración del foco al trigger, sin dependencias nuevas.
- Card interna que replica el mockup: ancho máximo 520px, fondo `#FBF4EC`, borde `#ECE0D0`, radio 24px, sombra `0 20px 50px -24px rgba(63,54,46,.35)`, `overflow: hidden`.
- Header del modal con tres elementos: "Cancelar" (izquierda, `#94887B`, peso 700, 15px), título "Agregar niño" (centro, Fredoka 600, 18px, `#3F362E`) y "Guardar" (derecha, `#D9583C`, peso 800, 15px), con separador inferior `#ECE0D0`.
- Cuerpo del modal con `padding: 24px 26px` y los 5 campos del mockup:
  - **NOMBRE COMPLETO**: input de texto, placeholder "Ej. Martina López", obligatorio.
  - **FECHA DE NACIMIENTO**: `input type="date"` nativo, obligatorio, con `max` igual a hoy.
  - **SALA**: `select` nativo con 3 opciones y "Soles" preseleccionado, obligatorio.
  - **ALERGIAS (ETIQUETAS)**: input de texto, placeholder "Ej. Maní, Lactosa", opcional.
  - **NOTAS MÉDICAS**: `textarea`, placeholder "Indicaciones, medicación, contactos…", `min-height` 90px, `resize: vertical`, opcional.
- Overlay claro sobre `/kids`: `::backdrop` con `rgba(63, 54, 46, 0.25)`.
- Validación client-side al enviar (submit del formulario):
  - Nombre vacío → error.
  - Fecha vacía → error. Fecha futura → error con mensaje propio.
  - Sala vacía → error.
  - Los errores se muestran inline: borde `#D9583C` en el campo + mensaje bajo el campo en `#D9583C` 13px.
- "Guardar" con el formulario válido cierra el modal y descarta los datos: no crea ningún niño ni modifica `mockKids`.
- "Cancelar" y `Esc` cierran el modal sin validar. Click en el overlay **no** cierra.
- Reset del formulario (valores y errores) al cerrar, de modo que cada apertura arranca en blanco.
- Bloqueo del scroll del `body` mientras el modal está abierto.
- Nuevo archivo `data/kids/mock-rooms.ts` con el array de salas `["Soles", "Lunas", "Estrellas"]`.
- Cambio en `app/(app)/kids/page.tsx`: el `<a href="#">` "Agregar niño" se reemplaza por `<AddKidModal />`. La page sigue siendo un server component.

**Fuera del alcance (para specs futuros):**

- Persistencia del alta: el niño no se agrega a la grilla, no se toca `mockKids` y no hay `localStorage` ni backend.
- Alta real / API / sesión.
- Alta o edición desde el perfil del niño: el botón "Editar" del SPEC 04 sigue siendo link muerto `#`.
- Etiquetas de alergias como chips con autocompletado: el campo es texto libre.
- Validación en vivo mientras se tipea: la validación corre al enviar.
- Agrupar la grilla de `/kids` por sala: la lista sigue bajo el encabezado "SALA SOLES".
- Reutilizar este modal para otros formularios ("Vincular padre", "Nueva publicación", "Editar niño"): son otras pantallas.
- Captura y comparación visual con Playwright.
- Modificar los specs 01 a 06: quedan como registro histórico.

## Modelo de datos

```ts
// data/kids/mock-rooms.ts
// Regla del repo: código en inglés, contenido visible en español.
// Solo las salas disponibles para el selector del modal de alta.

export const mockRooms: string[] = ["Soles", "Lunas", "Estrellas"];
```

Convenciones:

- Las salas viven en `data/kids/mock-rooms.ts` según la convención `data/<feature>/` del SPEC 02; el componente no declara la lista inline.
- El orden del array es fijo: "Soles", "Lunas", "Estrellas". No se baraja.
- `Kid` (`data/kids/mock-kids.ts`) no se modifica: el modal no crea niños, así que no hay tipo nuevo ni campo nuevo.
- El estado del formulario es local al componente y no persiste entre aperturas ni entre recargas:

```ts
// Estado local de components/kids/AddKidModal.tsx (useState, no global, no persistido)
interface AddKidFormState {
  name: string;
  birthDate: string; // "" | "YYYY-MM-DD"
  room: string; // "" | una de mockRooms
  allergies: string;
  medicalNotes: string;
}

type AddKidField = keyof AddKidFormState;
type AddKidErrors = Partial<Record<AddKidField, string>>;
```

- La fecha del input nativo ya viene en `YYYY-MM-DD`, el mismo formato que `Kid.birthDate` del SPEC 04, por si un spec futuro persiste el alta.
- "Hoy" para validar que la fecha no sea futura se calcula en el momento de la validación, no se guarda en un archivo.

## Plan de implementación

1. Leer la documentación de Next.js bundled en `node_modules/next/dist/docs/` (regla del repo) y confirmar el patrón de client component dentro de una page de App Router con `cacheComponents: true`. Verificación: `npm run dev` levanta y la page `/kids` sigue renderizando.
2. Crear `data/kids/mock-rooms.ts` con `mockRooms: string[]` = `["Soles", "Lunas", "Estrellas"]`. Verificación: `npx tsc --noEmit` pasa y el archivo exporta el símbolo.
3. Crear `components/kids/AddKidModal.tsx` con `"use client"`, un `ref` al `<dialog>` y el trigger "Agregar niño" con las mismas clases del `<a href="#">` actual (gradiente `#F4977E → #EE8164`, ícono `+` de 17px en SVG inline, sombra `0 8px 18px -8px rgba(238,129,100,.7)`), ahora como `<button type="button">`. Verificación: `/kids` muestra el botón igual que antes.
4. Montar el `<dialog>` en el mismo componente: card interna con fondo `#FBF4EC`, borde `#ECE0D0`, radio 24px, sombra `0 20px 50px -24px rgba(63,54,46,.35)`; header con "Cancelar" / título "Agregar niño" / "Guardar" y borde inferior `#ECE0D0`; cuerpo con `padding: 24px 26px`. El `<dialog>` lleva `aria-labelledby` apuntando al id del título. Verificación: el modal abre centrado, con el overlay `rgba(63,54,46,0.25)` detrás.
5. Agregar los 5 campos con sus labels (12px, peso 800, `letter-spacing: .7px`, `#94887B`) y estilos del mockup (`padding: 13px 16px`, radio 14px, borde 1.5px `#EADFD0`, fondo blanco, 15px). El `select` de SALA usa `appearance-none` con el chevron del mockup; el `textarea` de NOTAS MÉDICAS tiene `min-height: 90px` y `resize: vertical`. Verificación: los 5 campos se ven iguales al mockup.
6. Implementar la validación en el submit: `name` vacío, `birthDate` vacía o futura y `room` vacía producen error; el modal no cierra. Cada campo con error muestra borde `#D9583C` y un mensaje bajo el campo ("Este campo es obligatorio"; para la fecha futura, "La fecha no puede ser futura"). El foco se mueve al primer campo inválido. Verificación: al enviar vacío se ven 3 errores y el modal sigue abierto.
7. Implementar el cierre: `Cancelar` y `Esc` cierran (`Esc` es nativo de `<dialog>`), el click en el overlay no cierra, "Guardar" cierra solo si no hay errores. En el evento `close` se resetea el formulario (valores y errores) y se restaura el scroll del `body`; al abrir se bloquea con `overflow: hidden`. Verificación: abrir, cerrar y reabrir muestra el formulario vacío.
8. Conectar en `app/(app)/kids/page.tsx`: reemplazar el `<a href="#">` por `<AddKidModal />`, sin tocar el resto del layout de la page. Verificación: `/kids` renderiza el botón y el modal abre sin errores de hidratación.
9. Correr `npm run lint`, `npx tsc --noEmit`, `npm run build` y `node scripts/canonical-classes.mjs`. Verificación: los cuatro pasan sin errores ni clases no canónicas nuevas.

## Criterios de aceptación

- [ ] `npm run build`, `npm run lint`, `npx tsc --noEmit` y `node scripts/canonical-classes.mjs` pasan sin errores.
- [ ] El botón "Agregar niño" de `/kids` abre el modal y conserva el gradiente `#F4977E → #EE8164`, el ícono `+` de 17px, la sombra `0 8px 18px -8px rgba(238,129,100,.7)` y el texto del mockup.
- [ ] El modal aparece centrado sobre `/kids` con overlay `rgba(63, 54, 46, 0.25)` detrás.
- [ ] La card mide como máximo 520px de ancho, con fondo `#FBF4EC`, borde `#ECE0D0`, radio 24px y sombra `0 20px 50px -24px rgba(63,54,46,.35)`.
- [ ] El header muestra "Cancelar" a la izquierda (`#94887B`, peso 700, 15px), "Agregar niño" al centro (Fredoka 600, 18px, `#3F362E`) y "Guardar" a la derecha (`#D9583C`, peso 800, 15px), con separador inferior `#ECE0D0`.
- [ ] El cuerpo tiene `padding: 24px 26px` y muestra los 5 campos del mockup con sus labels en 12px peso 800, `letter-spacing: .7px`, `#94887B`.
- [ ] NOMBRE COMPLETO es un input de texto con placeholder "Ej. Martina López".
- [ ] FECHA DE NACIMIENTO es un `input type="date"` con el atributo `max` en la fecha de hoy, por lo que el picker no permite elegir fechas futuras.
- [ ] SALA es un `select` con exactamente 3 opciones (Soles, Lunas, Estrellas) y "Soles" preseleccionado.
- [ ] ALERGIAS (ETIQUETAS) es un input de texto con placeholder "Ej. Maní, Lactosa" y es opcional.
- [ ] NOTAS MÉDICAS es un `textarea` con placeholder "Indicaciones, medicación, contactos…", `min-height` 90px y `resize: vertical`, y es opcional.
- [ ] "Guardar" con el formulario vacío no cierra el modal y muestra "Este campo es obligatorio" bajo nombre, fecha de nacimiento y sala, con borde `#D9583C` en esos 3 campos.
- [ ] "Guardar" con una fecha futura no cierra el modal y muestra "La fecha no puede ser futura" bajo el campo de fecha.
- [ ] "Guardar" con el formulario válido cierra el modal y no crea ni modifica ningún niño en la grilla de `/kids`.
- [ ] "Cancelar" cierra el modal sin validar; `Esc` también lo cierra.
- [ ] Un click en el overlay no cierra el modal.
- [ ] Al reabrir el modal, el formulario está vacío y sin mensajes de error.
- [ ] Mientras el modal está abierto, el `body` no scrollea; al cerrar, vuelve a scrollear con normalidad.
- [ ] Al abrir, el foco cae en el input de nombre; al cerrar, el foco vuelve al botón "Agregar niño".
- [ ] El `<dialog>` tiene `aria-labelledby` apuntando al título "Agregar niño".
- [ ] En viewports < `lg` el modal no tiene scroll horizontal: ancho `calc(100% - 2rem)` con tope de 520px, y el contenido largo hace scroll vertical dentro del modal.
- [ ] La lista de salas vive en `data/kids/mock-rooms.ts`; `components/kids/AddKidModal.tsx` la importa y no la declara inline.
- [ ] `app/(app)/kids/page.tsx` sigue siendo un server component que solo orquesta: no declara datos ni estado del modal.
- [ ] `data/kids/mock-kids.ts` y el tipo `Kid` quedan sin cambios.

## Decisiones

- **Sí:** `<dialog>` nativo con `showModal()` en vez de un modal custom. Aporta top layer, focus trap, `Esc` y restauración del foco sin dependencias; el repo no tiene librerías de UI.
- **Sí:** el trigger y el modal viven en el mismo componente client `components/kids/AddKidModal.tsx`. El trigger necesita el `ref` del dialog, así que separarlos obligaría a subir el estado o usar un context.
- **No:** context provider global o modal dirigido por la URL (`/kids?nuevo=1`). Para un único punto de apertura es complejidad extra; una ruta nueva además chocaría con `[id]`.
- **No:** convertir `app/(app)/kids/page.tsx` en client component. La page sigue siendo server y solo monta el componente client.
- **Sí:** "Guardar" valida y cierra, sin efecto sobre los datos. Sin backend, un CTA que "guarda" algo que se pierde al recargar sería UI falsa, la misma línea que siguió el repo en el SPEC 03.
- **No:** agregar el niño a la grilla en memoria. Se descartaría al recargar y obligaría a mover el estado de la lista a un client component.
- **Sí:** la validación corre al enviar, no en vivo. Evita mostrar errores mientras el usuario todavía está por completar el campo.
- **Sí:** nombre, fecha de nacimiento y sala son obligatorios; alergias y notas médicas son opcionales. Los tres obligatorios son los datos mínimos para que un niño exista en la app; el resto se carga después.
- **Sí:** error inline (borde `#D9583C` + mensaje bajo el campo). La alternativa era un resumen arriba, que obliga a recorrer los campos para ubicar el problema.
- **Sí:** la fecha no puede ser futura, sin límite de edad mínima. La edad es un dato derivado; acotar el rango sin dato de sala real sería inventar reglas.
- **Sí:** `input type="date"` nativo, aunque el mockup muestre el placeholder "dd/mm/aaaa". El input nativo garantiza formato válido y el picker del sistema; el placeholder del mockup queda como dato histórico del diseño.
- **Sí:** `select` nativo con las 3 salas de `data/kids/mock-rooms.ts`, con "Soles" preseleccionado por ser el valor del mockup y la sala de la lista actual.
- **No:** orden aleatorio de las salas. Un select que cambia de orden en cada render hace imposible documentar el estado por defecto.
- **Sí:** overlay claro `rgba(63,54,46,0.25)`. El mockup no tiene overlay porque se renderiza como página; sobre `/kids` hace falta un velo para separar el modal del fondo, y se elige suave para no tapar el contexto.
- **No:** cerrar con click en el overlay. Evita perder lo tipeado por un click accidental; el mockup tampoco sugiere esa interacción.
- **Sí:** resetear el formulario al cerrar. Un modal de alta que arrastra datos de una apertura anterior confunde.
- **Sí:** bloquear el scroll del `body` mientras el modal está abierto. `<dialog>` modal no lo hace por sí solo en todos los navegadores.
- **No:** chips de etiquetas para las alergias. El mockup muestra un input de texto con placeholder "Ej. Maní, Lactosa"; el modelo de tags merece su propio spec.
- **No:** captura de Playwright ni comparación visual contra el mockup, como en el SPEC 06.
- **No:** reutilizar el modal para "Editar" del perfil ni para otros formularios. Cada pantalla con su propio spec.
- **No:** tocar los specs 01 a 06. El link muerto de "Agregar niño" del SPEC 03 queda desactualizado a propósito.

## Riesgos

| Riesgo                                                                                                          | Mitigación                                                                                                                |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| El `<dialog>` trae estilos por defecto del navegador (padding 1em, borde, fondo blanco, `max-width` calculado). | Resetear con clases (`p-0 border-0 bg-transparent`) y fijar el ancho a mano en todas las variantes.                       |
| El ancho por defecto del `<dialog>` modal lo deja a `calc(100% - 6px - 2em)`, con 2em de padding extra.         | Definir el ancho explícitamente con `w-[calc(100%_-_2rem)] max-w-[520px]`.                                                |
| El scroll lock del `body` no es nativo de `<dialog>`; si no se restaura, `/kids` queda sin scroll.              | Bloquear al abrir y restaurar en el evento `close`, que también dispara `Esc`.                                            |
| El variant `backdrop:` de Tailwind v4 aplica a `::backdrop`, pero podría no generar CSS en el build.            | Verificar en `npm run build`; fallback: regla `dialog::backdrop { background: rgba(63,54,46,.25) }` en `app/globals.css`. |
| `showModal()` sobre un dialog ya abierto lanza `InvalidStateError`.                                             | Guardar con `if (!dialog.open)` antes de llamar `showModal()`.                                                            |
| `input type="date"` renderiza el formato según el locale del navegador, que puede no ser `dd/mm/aaaa`.          | Decisión ya tomada (decisión de "FECHA DE NACIMIENTO"); el formato visible no es un criterio de aceptación.               |

## Qué NO está en este spec

- Persistencia del alta, backend, API y creación real de niños en `mockKids`.
- Alta o edición desde el perfil del niño.
- Etiquetas de alergias como chips y autocompletado de salas.
- Validación en vivo mientras se tipea.
- Agrupar la grilla de `/kids` por sala.
- Reutilización del modal en otras pantallas (vincular padre, nueva publicación, editar niño).
- Captura y comparación visual con Playwright.
- Cambios a los specs 01 a 06.

Cada una de esas, si aterriza, va en su propio spec.
