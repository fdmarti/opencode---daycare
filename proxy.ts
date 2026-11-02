import { type NextRequest, NextResponse } from 'next/server'

import { updateSession } from '@/utils/supabase/proxy'

/** Routes reachable without a session. Everything else is protected. */
const PUBLIC_ROUTES = ['/login', '/register']

/**
 * Builds a redirect that carries over the cookies written by the session
 * refresh. Without this, every request that ends in a redirect would lose
 * the refreshed token.
 */
function redirectWithCookies(url: URL, response: NextResponse): NextResponse {
  const redirectResponse = NextResponse.redirect(url)

  for (const cookie of response.headers.getSetCookie()) {
    redirectResponse.headers.append('set-cookie', cookie)
  }

  return redirectResponse
}

/** Keeps the Supabase session fresh and enforces the route policy. */
export async function proxy(request: NextRequest) {
  const { response, isAuthenticated } = await updateSession(request)

  const { pathname } = request.nextUrl
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  if (isPublicRoute && isAuthenticated) {
    return redirectWithCookies(new URL('/', request.url), response)
  }

  if (!isPublicRoute && !isAuthenticated) {
    return redirectWithCookies(new URL('/login', request.url), response)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
