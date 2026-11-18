import type { Salon } from "@berber/shared";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "./supabase/env";
import { createClient } from "./supabase/server";

export async function getOwnerContext(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  email: string;
  salon: Salon;
}> {
  if (!hasSupabaseEnv()) {
    redirect("/giris?yapilandirma=1");
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: salon } = await supabase.from("salons").select("*").eq("owner_id", user.id).maybeSingle();
  if (!salon) redirect("/salon-yok");

  return {
    supabase,
    userId: user.id,
    email: user.email ?? "",
    salon: salon as Salon,
  };
}
