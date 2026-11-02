import { createClient } from "@/utils/supabase/server";
import { deriveSessionData } from "@/utils/session";

/**
 * Saludo del feed con el nombre real de la sesión.
 *
 * Es un Server Component: la lectura de cookies ocurre dentro de un
 * `<Suspense>` (obligatorio con `cacheComponents: true`), por eso el fallback
 * con `Skeleton` vive en la página.
 */
export async function FeedHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { firstName } = deriveSessionData(user);

  return (
    <h1 className="font-display font-semibold text-[30px] text-tinta">
      Buenas, {firstName}
    </h1>
  );
}
