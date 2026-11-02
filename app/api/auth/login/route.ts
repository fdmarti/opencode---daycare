import { createClient } from "@/utils/supabase/server";

/**
 * Route Handler del login.
 *
 * A diferencia de una Server Action (que siempre responde 200), este handler
 * puede devolver el status real de Supabase. Eso permite propagar el `code` y
 * el `message` de Supabase tal cual, sin copy propio.
 */

interface LoginErrorBody {
  code: string;
  message: string;
}

/** Un status de Supabase es usable solo si es un status HTTP válido. */
function isUsableStatus(status: number | undefined): status is number {
  return typeof status === "number" && status >= 200 && status <= 599;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    // Siempre se delega en Supabase: no hay validación local previa.
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Sin status usable (red caída o proyecto mal configurado) no hay
      // respuesta de Supabase que propagar: se informa como error interno.
      if (!isUsableStatus(error.status)) {
        const body: LoginErrorBody = {
          code: "internal_error",
          message: error.message,
        };

        return Response.json(body, { status: 500 });
      }

      const body: LoginErrorBody = {
        code: error.code ?? "internal_error",
        message: error.message,
      };

      return Response.json(body, { status: error.status });
    }

    return Response.json({ ok: true });
  } catch (caughtError) {
    // Red caída o proyecto mal configurado: no hay respuesta de Supabase que
    // propagar, así que se devuelve el mensaje de la excepción capturada.
    const message =
      caughtError instanceof Error
        ? caughtError.message
        : String(caughtError);

    const body: LoginErrorBody = { code: "internal_error", message };

    return Response.json(body, { status: 500 });
  }
}
