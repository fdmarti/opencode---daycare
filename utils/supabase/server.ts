import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

/**
 * Supabase client for Server Components / Server Actions.
 * Cookies are read from the request; writes are only possible from
 * Server Actions or Route Handlers (the proxy refreshes the session).
 */
export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // `setAll` was called from a Server Component, where cookies are
          // read-only. Safe to ignore: the proxy refreshes the session.
        }
      },
    },
  })
}
