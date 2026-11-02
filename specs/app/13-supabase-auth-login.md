# SPEC 13 — Login con Supabase (email + password) y rutas protegidas

> **Estado:** Approved
> **Depende de:** SPEC 05 (pantalla de login), SPEC 12 (tabla `users` y usuario de prueba en Supabase Auth)
> **Fecha:** 2026-11-02
> **Objetivo:** Conectar la pantalla `/login` con Supabase Auth por email y contraseña usando su sesión por cookies, y proteger el route group `(app)` redirigiendo a `/login` a quien no tenga sesión.

## Por qué existe este spec

SPEC 05 dejó `/login` como una pantalla fiel al mockup pero sin backend: el botón era un link muerto `#`. Desde entonces el proyecto ya tiene lo que faltaba:

- Los clientes SSR de Supabase (`utils/supabase/client.ts`, `utils/supabase/server.ts`, `utils/supabase/proxy.ts`) y el `proxy.ts` que refresca la sesión en cada request.
- El proyecto remoto `nbxyedmbcaotimfwdskx` con `auth.users` poblado y un usuario de prueba verificado (`fededmartinez@gmail.com`, `role = staff`, `public.users.status = active`).

Lo que falta es el último eslabón: **consumir** esa sesión. Sin esto la app es indistinguible de una demo con mock data, y no hay forma de proteger nada.

## Alcance

**En:**

- `actions/auth.ts` (nuevo, en la raíz del repo): Server Actions `login` y `logout`.
  - `login(prevState, formData)` lee `email` y `password` del `FormData`, llama `signInWithPassword` con el cliente de servidor (`utils/supabase/server.ts`) y, si la credencial es válida, redirige a `/`.
  - `logout()` llama `signOut` y redirige a `/login`.
- `components/login/LoginForm.tsx`: pasa a Client Component con `useActionState`. El bloque de inputs pasa a ser un `<form action={...}>` real, los inputs reciben `name` (`email`, `password`), `required` y `autoComplete`, y el botón "Iniciar sesión" pasa de link muerto a `type="submit"`.
- Copy en español: botón deshabilitado con texto "Ingresando…" mientras corre el submit, y mensaje de error "El email o la contraseña no son correctos." debajo del botón.
- `utils/supabase/proxy.ts`: `updateSession` devuelve, además de la respuesta, si la request trae sesión (`isAuthenticated`), usando `supabase.auth.getClaims()`.
- `proxy.ts`: aplica la política de rutas — todo lo que no sea `/login` o `/register` exige sesión; con sesión activa, entrar a `/login` o `/register` redirige a `/`.
- `components/layout/Sidebar.tsx`: el ícono "Cerrar sesión" (hoy un link muerto `#`) pasa a un `<form action={logout}>` con botón `type="submit"`, conservando icono, tamaño y estilos.
- `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores.

**Fuera del alcance (para specs futuros):**

- Alta real de cuentas: `/register` sigue siendo el mock estático de SPEC 06 y el botón "Activar mi cuenta" sigue muerto.
- Reset de contraseña: "¿Olvidaste tu contraseña?" sigue siendo link muerto.
- Lectura del perfil de `public.users` (nombre, rol, guardería): la tabla sigue con RLS deny-all y sin policies. Mostrar datos reales del usuario requiere un spec de base de datos aparte.
- Policies de RLS, schema `private` y sus helpers (`current_daycare_id`, `is_admin`).
- RBAC por rol (`staff` / `parent` / `admin`) en la UI o en las rutas.
- MFA, magic link, OAuth y login social.
- Tipos generados de Supabase (`supabase gen types`).
- Multi-tenancy por guardería en la UI.
- Cambios a SPEC 05 y SPEC 06: quedan como registro histórico.

## Modelo de datos

Este feature **no introduce estructuras de datos nuevas** en la app. Reutiliza la sesión de Supabase Auth, que `@supabase/ssr` persiste en cookies del navegador (`sb-<project-ref>-auth-token`, fragmentadas si el token excede el límite de 4 KB).

Lo único nuevo es el tipo del estado que la Server Action devuelve al formulario:

```ts
// actions/auth.ts
export interface LoginState {
  /** Mensaje en español para mostrar debajo del botón. */
  error?: string;
}
```

La sesión en sí la administra Supabase: no hay JWT propio, ni tabla de sesiones, ni columna nueva en `public.users`. La base de datos remota no se modifica en este spec: `list_migrations` sigue devolviendo `create_daycares` y `create_users`.

Convenciones:

- Código (identificadores, archivos) en inglés; copy visible en español.
- La contraseña se procesa únicamente en el servidor. Nunca viaja al bundle del cliente ni se registra en logs.

## Plan de implementación

1. Crear `actions/auth.ts` con las dos Server Actions.
   - `login(prevState: LoginState | undefined, formData: FormData): Promise<LoginState>`:
     1. Leer `email` y `password` del `FormData` (`String(formData.get("email") ?? "")`, idem para `password`).
     2. Si alguno viene vacío, devolver `{ error: "El email o la contraseña no son correctos." }` sin tocar la red.
     3. Crear el cliente con `createClient()` de `utils/supabase/server.ts` y llamar `supabase.auth.signInWithPassword({ email, password })`.
     4. Si la llamada devuelve `error` **o** lanza una excepción (red caída, proyecto mal configurado), devolver el mismo mensaje genérico. No se distingue "email inexistente" de "contraseña incorrecta".
     5. Si la sesión se creó, llamar `redirect("/")` **fuera** del `try/catch` (el error `NEXT_REDIRECT` no debe capturarse).
   - `logout()`: `createClient()` → `supabase.auth.signOut()` → `redirect("/login")`.
   - Verificación: `npx tsc --noEmit` pasa y el archivo exporta ambas acciones.

2. Convertir `components/login/LoginForm.tsx` en Client Component interactivo.
   - Agregar `'use client'` al inicio del archivo.
   - `const [state, formAction, pending] = useActionState(login, undefined)`.
   - Envolver título, subtítulo, inputs y acciones en un `<form action={formAction}>`; los `<CustomInput>` reciben `name="email"` / `name="password"`, `required` y `autoComplete="email"` / `autoComplete="current-password"`.
   - El `<CustomButton>` pasa a `type="submit"`, con `disabled={pending}` y etiqueta `pending ? "Ingresando…" : "Iniciar sesión"`.
   - Cuando `state?.error` exista, renderizar un `<p>` debajo del botón con el estilo de error ya existente en la app (`text-[13px] text-acento`).
   - `app/login/page.tsx` no cambia: sigue orquestando y montando `<LoginForm />` dentro del panel de dos columnas.
   - Verificación: `/login` renderiza igual que antes (mismo gradiente, mismos títulos, mismos inputs) y el botón es un submit real.

3. Extender `utils/supabase/proxy.ts` para que exponga el estado de autenticación.
   - `updateSession(request)` deja de devolver solo `NextResponse` y devuelve `{ response: NextResponse; isAuthenticated: boolean }`.
   - `isAuthenticated` sale de `await supabase.auth.getClaims()`: `data` no nulo ⇒ hay sesión.
   - El resto del comportamiento (escritura de cookies en request y response) queda igual.
   - Verificación: `npx tsc --noEmit` pasa y `proxy.ts` (único consumidor) se actualiza en el mismo paso.

4. Aplicar la política de rutas en `proxy.ts`.
   - `const PUBLIC_ROUTES = ["/login", "/register"]`. Todo lo demás es protegido (default-deny: las rutas que se agreguen después quedan protegidas sin tocar este archivo).
   - Flujo: `const { response, isAuthenticated } = await updateSession(request)`.
     - Ruta pública **y** `isAuthenticated` ⇒ redirect a `/`.
     - Ruta protegida **y** `!isAuthenticated` ⇒ redirect a `/login`.
     - En cualquier otro caso ⇒ se devuelve `response`.
   - **Los redirects deben arrastrar las cookies de la respuesta de refresh**: se crea `NextResponse.redirect(url)` y se le copian los encabezados `set-cookie` de `response` (`response.headers.getSetCookie()`). Si no se copian, el refresh de sesión se pierde en cada request que termina en redirect.
   - El `matcher` actual se mantiene sin cambios.
   - Verificación manual: `GET /` sin cookies responde 307/308 con `location` apuntando a `/login`; `GET /login` con cookie de sesión responde con `location` apuntando a `/`.

5. Cablear el logout en `components/layout/Sidebar.tsx`.
   - Importar `logout` desde `actions/auth.ts` (una Server Action puede importarse en un Client Component y usarse como `action` de un `<form>`).
   - Reemplazar el `<a href="#" title="Cerrar sesión">` por `<form action={logout} className="flex-none">` conteniendo un `<button type="submit" title="Cerrar sesión">` con las mismas clases que tenía el link y el mismo `<LogoutIcon size={16} />`.
   - Verificación: el ícono se ve igual que antes y al clickearlo se borra la sesión y se navega a `/login`.

6. Verificación end-to-end con Playwright (dev server en `http://localhost:3000`), recorriendo el flujo completo: login fallido, login exitoso con `fededmartinez@gmail.com` / `abc12345`, navegación a `/` y `/kids`, logout y reintento de acceso a `/`.

7. Correr `npm run lint`, `npx tsc --noEmit` y `npm run build`. Verificación: los tres pasan sin errores.

## Criterios de aceptación

- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan sin errores.
- [x] Sin sesión, `GET /` responde con redirect a `/login` (status 307 o 308 y `location` con `/login`).
- [x] Sin sesión, `GET /kids` y `GET /kids/<id>` responden con redirect a `/login`.
- [x] Con sesión activa, `GET /login` y `GET /register` responden con redirect a `/`.
- [x] Con un email o una contraseña incorrectos, `/login` no navega y muestra "El email o la contraseña no son correctos." debajo del botón.
- [x] Con `fededmartinez@gmail.com` / `abc12345`, el submit redirige a `/` y el navegador queda con la cookie de sesión de Supabase (`sb-<project-ref>-auth-token`).
- [x] Durante el submit, el botón muestra "Ingresando…" y está deshabilitado.
- [x] Con sesión activa, `/` renderiza el feed y `/kids` renderiza la lista de niños, sin diferencias visuales respecto a SPEC 01 y SPEC 03.
- [x] Clickear "Cerrar sesión" en el sidebar borra la sesión, redirige a `/login`, y a continuación `GET /` vuelve a redirigir a `/login`.
- [x] Las cookies de sesión actualizadas por `updateSession` siguen presentes en la respuesta incluso cuando la request termina en redirect (el refresh no se pierde).
- [x] La contraseña no aparece en el bundle del cliente ni en logs: `actions/auth.ts` es la única pieza que la toca.
- [x] `/login` conserva el layout del mockup de SPEC 05 (gradiente, headline, títulos, etiquetas y tamaños de input); el único cambio visual es el botón ahora submit y el mensaje de error.
- [x] No se crea ni se modifica ninguna tabla en Supabase: `list_migrations` sigue devolviendo exactamente `create_daycares` y `create_users`, y `public.users` sigue con RLS habilitado y 0 policies.
- [x] La app no consulta `public.users` en ningún request.

## Decisiones

- **Sí:** Server Action para el login, en vez de Client Component con el browser client. La credencial nunca pasa por JavaScript del cliente y el `redirect()` de Next funciona de forma nativa.
- **Sí:** la protección vive solo en `proxy.ts`. Con `cacheComponents: true` ya activo en el proyecto, leer cookies en las páginas obligaría a envolver todo en `<Suspense>` o a marcar `instant = false`; el proxy redirige antes de renderizar y deja las páginas prerenderizables.
- **No:** un DAL con `verifySession()` / `getUser()` llamado en cada página ahora. La única razón para tenerlo es leer datos del usuario, y eso exige `public.users` con policies de lectura (spec de base de datos aparte). Cuando ese spec llegue, el DAL se suma; el proxy sigue siendo la primera barrera.
- **Sí:** default-deny (todo protegido salvo `/login` y `/register`). Las rutas nuevas quedan protegidas por defecto en vez de depender de que alguien las agregue a una lista.
- **Sí:** redirect fijo a `/` tras el login, sin `?next=`. La app tiene una sola entrada y el destino siempre es el feed.
- **Sí:** logout en este spec. Sin él la sesión no se puede cerrar desde la app y "Iniciar sesión" sería un estado de solo lectura.
- **Sí:** el mensaje de error es genérico ("El email o la contraseña no son correctos."). No se distingue entre email inexistente y contraseña incorrecta, para no enumerar cuentas.
- **Sí:** la misma cookie de error para un fallo de red o de configuración que para una credencial inválida. El detalle técnico se ve en los logs del servidor, no en la pantalla.
- **Sí:** se reutiliza la sesión de Supabase en vez de crear una sesión propia. Menos código, refresh y revocación resueltos por el proveedor.
- **Sí:** los redirects del proxy copian los `set-cookie` de la respuesta de refresh. Sin eso, cada request que redirige perdería el token renovado.
- **Sí:** `useActionState` + `<form action>`, el patrón de la guía de autenticación de Next 16 para credenciales.
- **No:** signup en `/register` ni flujo de invitaciones. SPEC 06 es un mock y el alta real depende de `invitations` / `accept_invitation`.
- **No:** reset de contraseña ("¿Olvidaste tu contraseña?").
- **No:** lectura de `public.users`, policies de RLS y schema `private`.
- **No:** RBAC por rol en las rutas o en la UI. El usuario de prueba es `staff`, pero el login no discrimina por rol.
- **No:** tipos generados de Supabase en el repo.
- **No:** tocar SPEC 05 ni SPEC 06. Sus criterios sobre el botón muerto y los inputs no controlados quedan desactualizados a propósito: los specs son registro histórico.

## Riesgos

| Riesgo                                                                                             | Mitigación                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El redirect del proxy se come las cookies de sesión renovadas y el usuario pierde la sesión.       | `redirectWithCookies` copia los encabezados `set-cookie` de la respuesta de refresh al redirect. Verificado con Playwright: tras login, la cookie sigue presente y `/` no rebota a `/login`.                    |
| `getClaims()` en cada request agrega latencia a la navegación.                                     | La verificación de firma usa el JWKS cacheado en memoria por `supabase-js`, y el matcher del proxy ya excluye los assets estáticos. Si se vuelve molesto, el chequeo se mueve a un DAL por página (spec de DB). |
| Los prefetches de las rutas protegidas disparan redirects que pueden ensuciar el waterfall de red. | Next sigue el redirect en la navegación del lado del cliente. El destino (`/login`) es público, así que no hay loop. Verificado en el panel de red de Playwright.                                               |
| `public.users` sigue con RLS deny-all, así que la app no puede mostrar el nombre ni el rol reales. | Fuera de alcance, documentado en el spec. El sidebar mantiene el dato mock hasta que exista el spec de policies.                                                                                                |
| El único usuario de prueba es `staff`, pero el login no discrimina roles.                          | El RBAC es un spec aparte. Este spec solo verifica "hay sesión" vs "no hay sesión".                                                                                                                             |
| La contraseña del usuario de prueba queda escrita en el spec y en los criterios de aceptación.     | Es una credencial de prueba de un proyecto de desarrollo, ya documentada en SPEC 12. Ningún secret real se commitea.                                                                                            |

## Qué NO está en este spec

- Alta real de cuentas, invitaciones y `accept_invitation`.
- Reset de contraseña y pantalla de nueva contraseña.
- Lectura de `public.users`, policies de RLS y schema `private` con sus helpers.
- RBAC por rol (`staff` / `parent` / `admin`).
- MFA, magic link y login social (Google, etc.).
- Tipos generados de Supabase.
- Multi-tenancy por guardería en la UI.
- Cambios a SPEC 05, SPEC 06 y SPEC 12.

Cada una de esas, si aterriza, va en su propio spec.
