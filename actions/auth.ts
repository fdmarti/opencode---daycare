"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

/** Server Action de logout: borra la sesión y vuelve al login. */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/login");
}
