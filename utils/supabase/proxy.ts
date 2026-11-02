import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

/**
 * Refreshes the Supabase session on every request.
 *
 * The refreshed tokens are written to the request (so server components read
 * the new ones) and to the response (so the browser stores them).
 * `getClaims()` must run before the response is generated, otherwise the
 * refreshed cookies are lost.
 *
 * Returns the response plus whether the request carries a valid session.
 */
export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value)
        })
      },
    },
  })

  // Triggers the session refresh (and the cookie write above).
  // `data` is non-null when the request carries a valid session.
  const { data } = await supabase.auth.getClaims()

  return { response: supabaseResponse, isAuthenticated: data !== null }
}
