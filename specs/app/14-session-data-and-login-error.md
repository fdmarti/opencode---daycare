# SPEC 14 — Respuesta del login según Supabase y datos de sesión en sidebar y home

> **Status:** Approved
> **Depends on:** SPEC 13 (login con Supabase y rutas protegidas), SPEC 12 (usuario de prueba con `full_name` en `user_metadata`)
> **Date:** 2026-11-02
> **Objective:** Propagar el status, el `code` y el `message` que Supabase devuelve cuando el login falla, y mostrar los datos reales de la sesión en el sidebar (nombre, inicial, rol y guardería) y en el home (solo nombre), con efecto hover en el botón de logout.

## Por qué existe este spec

SPEC 13 dejó el login funcionando pero con dos deudas:

- **La respuesta del login fallido es un 200 con copy propio.** Next no permite status personalizados en Server Actions: la acción devuelve nuestro mensaje en español y el HTTP responde 200. Se necesita propagar tal cual lo que Supabase devuelve — su status (400), su `code` (`invalid_credentials`) y su `message` (`"Invalid login credentials"`) — que hoy se traga y se reemplaza.
- **La UI sigue mostrando datos mock.** El sidebar dice "Caro Giménez · Maestra · Soles" y el home dice "Buenas, Caro" aunque la sesión real es de "Federico Martínez" (`staff`, Guardería Soles). No hay forma de ver quién está logueado.

Además, el botón de logout no tiene feedback de hover.

## Alcance

**En:**

- `app/api/auth/login/route.ts` (nuevo): Route Handler `POST` que recibe un `FormData` con `email` y `password` y **siempre** llama a `signInWithPassword` (sin guard local de campos vacíos: el `required` del formulario ya lo evita, y si llegan vacíos los valida Supabase).
  - Error de Supabase → responde con **el mismo status** que devolvió (`error.status`, p. ej. 400) y body `{ code: error.code, message: error.message }`.
  - Excepción (red caída, proyecto mal configurado) → `500` con `{ code: "internal_error", message: <mensaje de la excepción capturada> }`.
  - Credencial válida → `200` con `{ ok: true }` y las cookies de sesión de Supabase (`@supabase/ssr` puede escribir cookies desde un Route Handler; `utils/supabase/server.ts` ya lo soporta).
  - **No se produce ningún mensaje propio**: ni en español ni inventado. El mensaje que ve el usuario es literalmente el de Supabase.
- `proxy.ts`: eximir `/api/*` de la política de rutas. Hoy `PUBLIC_ROUTES` es default-deny por igualdad exacta: sin esto, el `POST /api/auth/login` sin sesión sería redirigido a `/login` (307) y un re-login con sesión quedaría redirigido a `/`. Las rutas `/api/*` siguen pasando por `updateSession` (el refresh de sesión no se toca) y solo se saltean los redirects de política.
- `components/login/LoginForm.tsx`: deja de usar `useActionState` + Server Action y pasa a `fetch` contra el Route Handler.
  - `onSubmit` con `preventDefault()`, `new FormData(e.currentTarget)` y `fetch("/api/auth/login", { method: "POST", body: formData })`.
  - Estado local `pending` (botón "Ingresando…" deshabilitado, igual que hoy) y `error` (mismo `<p>` de estilo `text-[13px] text-acento` debajo del botón).
  - `response.ok` → `router.push("/")`. Si no: `setError(body.message)`. Si la respuesta no es JSON o no trae `message`, o si el `fetch` falla a nivel de red → mensaje fijo `"Something went wrong. Please try again."` (único copy propio que queda, para el caso en que no hay respuesta de Supabase que propagar).
  - El resto del layout de SPEC 05 no cambia.
- `actions/auth.ts`: se elimina la Server Action `login` y la interfaz `LoginState`; queda solo `logout`.
- `hooks/useSession.ts` (nuevo): hook de Client Component con `createClient()` de `utils/supabase/client.ts` y `supabase.auth.getUser()` en un `useEffect`.
  - Devuelve `{ fullName, firstName, initial, roleLabel, daycareName, isLoading }` (ver "Modelo de datos").
  - `fullName` sale de `user_metadata.full_name`; si falta, del email sin dominio (`fededmartinez@gmail.com` → `fededmartinez`).
  - `firstName` es el primer token de `fullName`; `initial` es su primera letra en mayúscula.
  - `roleLabel` mapea `app_metadata.role` a copy en español: `staff → "Staff"`, `parent → "Familia"`, `admin → "Admin"`; valores desconocidos se muestran tal cual.
  - `daycareName` sale de `app_metadata.daycare_name`; si falta, `null`.
  - Sin usuario (error de red en `getUser()`): todos los campos quedan vacíos/`null` y `isLoading` en `false`.
- `components/common/ui/Skeleton.tsx` (nuevo): componente reutilizable de placeholder, `animate-pulse`, con prop `className` (tamaño/forma) y prop `circle` (renderiza `rounded-full` en vez de `rounded-lg`). Queda disponible para futuros usos.
- `components/layout/Sidebar.tsx`: consume `useSession()`.
  - Avatar: inicial real (`F`) en vez de `C`; mientras `isLoading`, un `Skeleton circle` del mismo tamaño (`w-9.5 h-9.5`).
  - Nombre: `fullName` (`Federico Martínez`) en vez de "Caro Giménez"; mientras `isLoading`, un `Skeleton` de una línea.
  - Línea inferior: `daycareName ? \`${roleLabel} · ${daycareName}\` : roleLabel`→ "Staff · Guardería Soles"; mientras`isLoading`, un `Skeleton` de una línea más angosta. (El mock "Maestra · Soles" queda reemplazado por dato real; "Sala Soles" bajo el logo no se toca.)
  - Botón de logout: `hover:bg-acento hover:text-white transition-colors` sobre las clases actuales.
- `components/feed/FeedHeader.tsx` (nuevo, Server Component async): lee la sesión con `createClient()` de `utils/supabase/server.ts` + `supabase.auth.getUser()` y renderiza solo el `<h1>` "Buenas, {firstName}" con las mismas reglas de fallback que el hook. Al ser Server Component con `cacheComponents: true`, la lectura de cookies va obligatoriamente dentro de `<Suspense>`.
- `app/(app)/page.tsx`: el `<h1>Buenas, Caro</h1>` pasa a `<Suspense fallback={<Skeleton className="h-9 w-56" />}><FeedHeader /></Suspense>`. El resto del header ("GUARDERÍA · SALA SOLES", "12 niños · martes 17 jun") sigue en el `page` como mock, sin cambios.
- Cambio de datos (no de esquema) por MCP `execute_sql`: agregar `daycare_name: "Guardería Soles"` al `raw_app_meta_data` del usuario de prueba. No es migración: los datos no se versionan como archivo.
- `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores, y el flujo completo se verifica con Playwright (dev server en `http://localhost:3000`).

**Fuera del alcance (para specs futuros):**

- Policies de RLS y lectura de `public.users` / `public.daycares`: la guardería y el rol siguen viniendo de la metadata; migrar a las tablas requiere un spec de base de datos aparte.
- Registro real (`/register`) y reset de contraseña: siguen siendo mocks de SPEC 06.
- Usar `useSession` en otras pantallas (niños, mi cuenta, avisos): el hook queda listo, pero solo se consume en el sidebar en este spec.
- Traducir el mensaje de Supabase al español: el login muestra el texto en inglés de Supabase (decisión transitoria; más adelante se puede hacer en la UI).
- RBAC: el rol se muestra, no se usa para autorizar nada.
- Skeleton para listas, tablas o el feed completo: solo se crea el componente base.
- Cambios al copy mockup del home ("GUARDERÍA · SALA SOLES", "12 niños · martes 17 jun") y del logo ("Sala Soles").
- Actualizar SPEC 13: es registro histórico; sus criterios sobre Server Action, status 200 y el mensaje en español quedan desactualizados a propósito.

## Modelo de datos

No hay tablas nuevas ni migraciones. Lo que cambia es la metadata de la sesión y dos estructuras en la app:

```ts
// hooks/useSession.ts
export interface SessionData {
  /** user_metadata.full_name, o el email sin dominio si falta. */
  fullName: string;
  /** Primer token de fullName: lo que muestra el home. */
  firstName: string;
  /** Primera letra de firstName en mayúscula: el avatar del sidebar. */
  initial: string;
  /** app_metadata.role traducido a copy en español. */
  roleLabel: string;
  /** app_metadata.daycare_name; null cuando el usuario no lo tiene. */
  daycareName: string | null;
}
```

```ts
// app/api/auth/login/route.ts (responses)
type LoginOkResponse = { ok: true };
type LoginErrorResponse = {
  code: string; // error.code de supabase-js, p. ej. "invalid_credentials"
  message: string; // error.message de supabase-js, p. ej. "Invalid login credentials"
};
```

Metadata del usuario de prueba (dato, aplicado por `execute_sql`):

```json
{
  "daycare_id": "<uuid de Guardería Soles>",
  "daycare_name": "Guardería Soles",
  "role": "staff"
}
```

Convenciones:

- Código (identificadores, archivos) en inglés; copy visible en español, salvo el mensaje de error del login, que es el de Supabase en inglés.
- La metadata se usa **solo para mostrar**: nunca para autorizar (eso sigue siendo la sesión del proxy y, a futuro, RLS).
- La contraseña solo viaja del formulario al Route Handler: no se registra en logs ni se guarda en estado de React.

## Plan de implementación

1. Crear `app/api/auth/login/route.ts` y eximir `/api/*` en `proxy.ts`.
   - `POST(request)`: `formData = await request.formData()`, leer `email`/`password` y llamar siempre a `signInWithPassword`.
   - `error` → responder con `error.status` y body `{ code: error.code, message: error.message }`.
   - Excepción → 500 `{ code: "internal_error", message: String(caughtError.message) }`.
   - Sesión creada → 200 `{ ok: true }`.
   - En `proxy.ts`: `const isApiRoute = pathname.startsWith("/api/")`; si es API, devolver `response` sin aplicar los dos redirects de política.
   - Verificación: `POST /api/auth/login` con credenciales malas responde 400 (status de Supabase, no 200 ni 307) con `{ code: "invalid_credentials", message: "Invalid login credentials" }`.
2. Convertir `components/login/LoginForm.tsx` al flujo con `fetch`.
   - Reemplazar `useActionState(login, undefined)` por `useState` de `pending` y `error`, y un `handleSubmit` con `preventDefault()` + `fetch` + `res.json()` en `try`.
   - `res.ok` → `router.push("/")`; si no, `setError(body.message ?? FALLBACK_MESSAGE)`; `catch` (red o JSON inválido) → `FALLBACK_MESSAGE = "Something went wrong. Please try again."`.
   - Mantener `<form onSubmit={handleSubmit}>`, `CustomButton type="submit"` con `disabled={pending}` y el `<p>` de error con el mismo estilo.
   - Verificación manual: login malo muestra debajo del botón `Invalid login credentials` y no navega; login bueno entra al feed.
3. Limpiar `actions/auth.ts`: eliminar `login` e `LoginState`, dejar solo `logout`. Verificación: `npx tsc --noEmit` pasa y el logout del sidebar sigue funcionando.
4. Agregar `daycare_name` al metadata del usuario de prueba por MCP `execute_sql` (`update auth.users set raw_app_meta_data = raw_app_meta_data || '{"daycare_name": "Guardería Soles"}' where email = 'fededmartinez@gmail.com'`). Verificación: `select raw_app_meta_data from auth.users` muestra los tres campos y `getUser()` los devuelve.
5. Crear `components/common/ui/Skeleton.tsx` con `className` y `circle`. Verificación: `npx tsc --noEmit` pasa y el componente compila.
6. Crear `hooks/useSession.ts` con `getUser()` y las derivaciones de "Alcance". Verificación: `npx tsc --noEmit` pasa; se consume en el paso siguiente.
7. Cablear `components/layout/Sidebar.tsx`: hook + skeletons + nombre/inicial/rol reales + `hover:bg-acento hover:text-white transition-colors` en el botón de logout. Verificación con Playwright: el sidebar muestra "Federico Martínez", "F" y "Staff · Guardería Soles"; el hover pinta el fondo de acento con ícono blanco.
8. Crear `components/feed/FeedHeader.tsx` y montarlo en `app/(app)/page.tsx` dentro de `<Suspense fallback={<Skeleton className="h-9 w-56" />}>`. Verificación: el home dice "Buenas, Federico" y, con la sesión lenta (throttling de red), se ve el Skeleton en vez del texto.
9. Verificación end-to-end con Playwright: login fallido (status de Supabase en la red + mensaje en pantalla), login exitoso, sidebar y home con datos reales, hover del logout, logout y reintentos de acceso a `/`.
10. Correr `npm run lint`, `npx tsc --noEmit` y `npm run build`. Verificación: los tres pasan sin errores.

## Criterios de aceptación

- [x] `POST /api/auth/login` con credenciales incorrectas responde con **el status de Supabase** (400, no 200 ni 307) y body `{ code: "invalid_credentials", message: "Invalid login credentials" }`.
- [x] `POST /api/auth/login` con credenciales válidas responde **200** con `{ ok: true }` y `set-cookie` de sesión.
- [x] `POST /api/auth/login` con campos vacíos también pasa por Supabase y propaga su respuesta (no hay validación local previa).
- [x] Simulada una excepción en el Route Handler (red/config), responde 500 con `{ code: "internal_error", message: <mensaje de la excepción> }`.
- [x] El proxy no redirige las requests a `/api/*`: un `POST` sin sesión responde 400/200, nunca 307 a `/login`.
- [x] En `/login`, credenciales malas: no navega y muestra debajo del botón exactamente el `message` que devolvió Supabase (`Invalid login credentials`), con el botón "Ingresando…" deshabilitado durante el submit.
- [x] En `/login`, credenciales válidas: navega a `/` y el navegador queda con la cookie `sb-<project-ref>-auth-token`.
- [x] Con sesión activa, el sidebar muestra "Federico Martínez", la inicial "F" en el avatar y "Staff · Guardería Soles" debajo del nombre.
- [x] Con sesión activa, el home muestra "Buenas, Federico" (solo el nombre, sin apellido).
- [x] Mientras carga la sesión, el sidebar y el home muestran el componente `Skeleton` (no se ve ningún nombre, ni real ni mock).
- [x] El usuario no tiene `daycare_name` → el sidebar muestra solo "Staff"; no tiene `full_name` → se usa el email sin dominio.
- [x] Hover en el botón de logout: el fondo pasa a `--color-acento` y el ícono a blanco, con `transition-colors` (verificable por estilos computados en Playwright).
- [x] Cerrar sesión sigue funcionando: borra la sesión, redirige a `/login` y `GET /` vuelve a redirigir a `/login`.
- [x] `LoginForm` ya no usa `useActionState` ni importa de `actions/auth.ts`; `actions/auth.ts` ya no exporta `login` ni `LoginState`.
- [x] La contraseña no se registra en logs ni se guarda en estado de React; solo transita del formulario al Route Handler.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores.
- [x] No se modificó ningún esquema en Supabase: `list_migrations` sigue devolviendo exactamente `create_daycares` y `create_users`, y `public.users` sigue con 0 policies.
- [x] `/login` conserva el layout de SPEC 05 y el home conserva su copy mockup fuera del saludo (guardería, fecha, "12 niños").

## Decisiones

- **Sí:** Route Handler para el login, no Server Action. Next no permite status personalizados en Server Actions (si la acción retorna normal, la respuesta es 200): un status de error real exige un Route Handler. Esto **invierte la decisión "Server Action para el login" de SPEC 13**, registrada aquí explícitamente; `logout` sigue siendo Server Action.
- **Sí:** propagar status, `code` y `message` de Supabase tal cual, sin traducir. El usuario decidió que "por ahora no importa el idioma": la validación es solo de Supabase y nuestro servidor no genera copy. **Invierte dos decisiones de SPEC 13**: el status 200 (ahora el de Supabase) y el mensaje genérico en español (ahora el de Supabase).
- **Sí:** siempre llamar a `signInWithPassword`, incluso con campos vacíos. Un guard local reintroduciría validación y copy propios, que es justo lo que se elimina.
- **Sí:** 500 con el mensaje de la excepción cuando Supabase no responde. No hay nada de Supabase que propagar; ese caso se cubre con el único texto fijo de la UI (`"Something went wrong. Please try again."`).
- **No:** mensaje genérico "El email o la contraseña no son correctos." → queda fuera del flujo de login.
- **No:** devolver el body crudo de la respuesta HTTP de Supabase (`error_code`/`msg`). Se usa la forma normalizada de supabase-js (`error.code` / `error.message`).
- **No:** lanzar excepción desde la Server Action para forzar un 500. Sería un 500 genérico sin control del body y rompería la UI de `useActionState`.
- **Sí:** `daycare_name` en `app_metadata`. Es la única forma de mostrar la guardería hoy sin un spec de base de datos (RLS es deny-all). Costos asumidos: el nombre puede quedar desactualizado si cambia la guardería, y el flujo real de alta/invitación deberá escribirlo en el servidor (queda documentado aquí).
- **No:** leer `public.users` ni `public.daycares`. Requiere policies de RLS → spec de base de datos aparte, fuera del "un solo spec" acordado.
- **Sí:** el hook usa `getUser()` y no `getSession()`. `getUser()` va al servidor y devuelve el metadata vigente aunque el JWT guardado en la cookie tenga claims viejos (clave después del update de `daycare_name`); cuesta una llamada a Supabase por montaje del sidebar, aceptable para datos de display.
- **Sí:** el home lee la sesión en el Server Component (`FeedHeader`) en vez del hook. Decisión del usuario; obligada a vivir dentro de `<Suspense>` por `cacheComponents: true`, patrón ya anticipado en SPEC 13.
- **Sí:** `Skeleton` como componente común en `components/common/ui/` desde el inicio, no un `div` inline en el sidebar. Se reutiliza en el home ahora y en otras pantallas después.
- **Sí:** fallback del nombre = email sin dominio, y fallback de la línea = solo el rol cuando falta `daycare_name`. Nunca un UUID ni texto inventado en la UI.
- **Sí:** eximir `/api/*` de la política de rutas en `proxy.ts` (con `startsWith`, no una lista de rutas exactas). El default-deny de SPEC 13 bloquearía el propio endpoint de login.
- **Sí:** hover `bg-acento` + ícono blanco con `transition-colors`. Los mockups no definen hover; es la variante más visible y coherente con la paleta.
- **Sí:** el seed de `daycare_name` va por `execute_sql`, no por migración. Los datos no son esquema.
- **No:** tocar SPEC 13 ni SPEC 05. Sus criterios sobre Server Action, status 200, copy en español y "Caro Giménez" quedan desactualizados a propósito: los specs son registro histórico.

## Riesgos

| Riesgo                                                                                                  | Mitigación                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La lectura de cookies del home sale del `<Suspense>` y el saludo se hornerea con datos de otro usuario. | `FeedHeader` queda envuelto siempre; el criterio de aceptación verifica el Skeleton y el render por request.                                                     |
| El mensaje de la excepción (500) puede exponer detalles internos del error.                             | Aceptado explícitamente; también queda en los logs del servidor. Solo aparece si Supabase no responde, nunca ante credenciales inválidas.                        |
| El mensaje en inglés rompe el copy en español de la app.                                                | Decisión transitoria del usuario ("por ahora no importa el idioma"). Cuando se quiera traducir, se hace en la UI o se reintroduce copy propio en un spec futuro. |
| `getUser()` agrega una llamada a Supabase en cada montaje del sidebar.                                  | Aceptada para display; si se vuelve molesta, cambiar a `getSession()` (lectura local de la cookie) documentado en Decisiones.                                    |
| `getUser()` falla (red) → sidebar sin nombre.                                                           | `isLoading` pasa a `false` con datos vacíos: las líneas quedan vacías, no un skeleton infinito.                                                                  |
| El `fetch` del login falla a nivel de red.                                                              | `catch` en `handleSubmit` muestra el mensaje fijo `"Something went wrong. Please try again."`; nunca un error crudo.                                             |
| Usuarios futuros sin `full_name` o `daycare_name` en la metadata.                                       | Fallbacks definidos (email sin dominio; solo rol) y verificados como criterio de aceptación.                                                                     |
| Invertir las decisiones de SPEC 13 confunde a quien lea el repo.                                        | La sección "Decisiones" de este spec registra las inversiones y el motivo (status real de Supabase, sin copy propio).                                            |

## Qué NO está en este spec

- Policies de RLS, lectura de `public.users` / `public.daycares` y schema `private`.
- Registro real (`/register`), invitaciones y reset de contraseña.
- Traducción del mensaje de error de Supabase al español.
- RBAC: el rol se muestra pero no autoriza nada.
- Consumo de `useSession` en pantallas distintas del sidebar.
- Skeleton para listas, tablas o feed completo.
- Cambios al copy mockup del home, del logo o del sidebar más allá del bloque de usuario.
- MFA, login social, tipos generados de Supabase.
- Actualizar SPEC 13, SPEC 05 y SPEC 12.

Cada una de esas, si aterriza, va en su propio spec.
