import { connection } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { deriveSessionData } from "@/utils/session";

export async function FeedHeader() {
  await connection();

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
