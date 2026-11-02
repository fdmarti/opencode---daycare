import type { NextRequest } from 'next/server'

import { updateSession } from '@/utils/supabase/proxy'

/** Keeps the Supabase session fresh on every request. */
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
