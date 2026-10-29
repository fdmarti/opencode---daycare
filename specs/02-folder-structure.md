# SPEC 02 — Reorganización de carpetas al estilo Nuxt

> **Estado:** Aprovado
> **Depende de:** SPEC 01 (implementado)
> **Fecha:** 2026-10-29
> **Objetivo:** Reorganizar la estructura del proyecto a una convención por carpetas al estilo Nuxt: `components/<feature>/` para las UI, `data/<feature>/` para la data mockeada, conservando intacta la estructura de ruteo de `app/`.

## Alcance

**En:**

- Mover los componentes de feature desde `features/` a `components/<feature>/`:
  - `features/feed/post.tsx` → `components/feed/Post.tsx`
  - `features/feed/composer.tsx` → `components/feed/Composer.tsx`
  - `features/layout/sidebar.tsx` → `components/layout/Sidebar.tsx`
- Mover la data mockeada del dominio feed a `data/feed/mock-posts.ts` (antes `features/feed/mock-data.ts`).
- Lo transversal vive en `components/common/`, subdividido en una carpeta por preocupación:
  - `components/common/Icons.tsx` → `components/common/icons/Icons.tsx`
- Renombrar los archivos de componentes a `PascalCase` (convención de la documentación de Next.js/React).
- Actualizar todos los imports afectados (`app/(app)/page.tsx`, `app/(app)/layout.tsx`) vía alias `@/*`.

**Fuera del alcance (para specs futuros):**

- Cualquier cambio de lógica, markup, estilos o contenido de los componentes (cambio estructural puro).
- Modificar `specs/01-feed-home.md` ni ningún otro spec: quedan como registro histórico.
- Nuevas features, pantallas o rutas: la estructura de `app/` (route groups, `layout.tsx`, `page.tsx`) se respeta tal como la maneja Next.js.
- Cambios a la configuración de Next/Tailwind.

## Modelo de datos

Sin datos nuevos. Se renombra un archivo existente:

```ts
// data/feed/mock-posts.ts (antes: features/feed/mock-data.ts)
// El contenido (Post, PostType, mockPosts) no cambia; solo la ubicación y el nombre del archivo,
// que ahora indica explícitamente que la data es mock.
```

La carpeta `data/` no colisiona con ninguna convención especial de Next.js (el ruteo vive solo en `app/`).

## Convención de estructura

```text
app/                  # ruteo + layouts (convención Next.js, intacta)
  (app)/
    layout.tsx
    page.tsx
components/           # UI separada por feature (patrón Nuxt)
  feed/               # componentes del feature feed
    Post.tsx
    Composer.tsx
  layout/             # shell compartido entre features
    Sidebar.tsx
  common/             # transversal, una carpeta por preocupación
    icons/
      Icons.tsx
data/                 # data mockeada, una carpeta por feature
  feed/
    mock-posts.ts
```

## Plan de implementación

1. Crear `components/feed/Post.tsx`, `components/feed/Composer.tsx`, `components/layout/Sidebar.tsx` y `data/feed/mock-posts.ts` a partir de los archivos actuales (contenido idéntico, solo cambia nombre/ubicación; borrar `features/`). Verificación: `npx tsc --noEmit` resuelve los nuevos paths.
2. Actualizar imports en `app/(app)/page.tsx` (Composer, Post, mockPosts) y `app/(app)/layout.tsx` (Sidebar) a los nuevos paths con alias `@/`. Verificación: `npm run dev` renderiza `/` sin errores.
3. Mover `components/common/Icons.tsx` a `components/common/icons/Icons.tsx` y actualizar sus imports. Verificación: sin referencias rotas.
4. Correr `npm run lint` y `npm run build`. Verificación final: ambos pasan y `git status` no muestra archivos sobrantes en `features/`.

## Criterios de aceptación

- [x] No existe la carpeta `features/`.
- [x] `components/feed/Post.tsx`, `components/feed/Composer.tsx`, `components/layout/Sidebar.tsx` existen con nombres PascalCase.
- [x] `data/feed/mock-posts.ts` existe y compila; la data vive fuera de `components/`.
- [x] `components/common/Icons.tsx` quedó en `components/common/icons/`.
- [x] No hay imports rotos: `npm run build` y `npm run lint` pasan.
- [x] `/` renderiza idéntico a antes (mismo markup, estilos y contenido); los visual deltas con el mockup son los mismos que al cierre del SPEC 01.
- [x] `app/` no se modifica: ni rutas ni layouts ni pages.
- [x] `specs/01-feed-home.md` no fue modificado.

## Decisiones

- **Sí:** convención estilo Nuxt (`components/<feature>/`, `data/<feature>/`). La organización por feature que ya teníamos, pero con las dos carpetas de nivel superior separadas por rol (UI vs data).
- **Sí:** transversales en `components/common/`, subdividido en carpetas por preocupación (`common/icons/`). Coexiste con los features como en Nuxt (múltiples dirs bajo `components/`).
- **Sí:** `Sidebar` en `components/layout/` en vez de `common`. Sigue siendo del dominio shell/layout del `(app)`.
- **Sí:** PascalCase para archivos de componentes, siguiendo la recomendación de la documentación de Next.js/React. El data file queda kebab-case (`mock-posts.ts`) porque no es un componente.
- **Sí:** cambio estructural puro: solo mover archivos + actualizar imports. Menor riesgo y diff fácil de revisar.
- **No:** editar el SPEC 01. Queda como estaba cuando se implementó, como registro histórico. La decisión de `features/` del SPEC 01 queda implícitamente reemplazada por la de este spec (un spec posterior reemplaza la convención definida por uno anterior).
- **No:** tocar `app/`. El ruteo respeta la convención de Next.js; ni un move ni un rename.
- **No:** refactorizar contenido de componentes al mover (aunque se puedan percibir mejoras); no mezclar cambios estructurales con de código.

## Qué NO está en este spec

- Lógica nueva, interactividad, estilos ni markup.
- Carpetas por features futuras (avisos, ninos, etc.): se crearán con sus propios specs siguiendo esta convención.
- Cambios a specs existentes.

Cada una de esas, si aterriza, va en su propio spec.
