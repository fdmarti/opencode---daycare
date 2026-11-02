"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export interface LoginState {
  /** Mensaje en español para mostrar debajo del botón. */
  error?: string;
}

const INVALID_CREDENTIALS_ERROR = "El email o la contraseña no son correctos.";

/**
 * Server Action de login con email y contraseña.
 *
 * La credencial se procesa únicamente en el servidor: nunca viaja al bundle
 * del cliente ni se registra en logs.
 */
export async function login(
  prevState: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: INVALID_CREDENTIALS_ERROR };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: INVALID_CREDENTIALS_ERROR };
    }
  } catch {
    // Fallo de red o de configuración: mismo mensaje genérico que una
    // credencial inválida. El detalle técnico queda en los logs del servidor.
    return { error: INVALID_CREDENTIALS_ERROR };
  }

  // Fuera del try/catch: `redirect()` lanza NEXT_REDIRECT, que no debe
  // capturarse.
  redirect("/");
}

/** Server Action de logout: borra la sesión y vuelve al login. */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/login");
}
