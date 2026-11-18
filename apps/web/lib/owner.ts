import type { Salon } from "@berber/shared";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "./supabase/env";
import { createClient } from "./supabase/server";

export type PanelAccess = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  email: string;
  salon: Salon;
  role: "owner" | "staff";
  staffId: string | null;
};

export async function getAccessContext(): Promise<PanelAccess> {
  if (!hasSupabaseEnv()) {
    redirect("/giris?yapilandirma=1");
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  await supabase.rpc("accept_staff_invite", { p_token: null }).then(
    () => undefined,
    () => undefined,
  );

  const { data: owned } = await supabase.from("salons").select("*").eq("owner_id", user.id).maybeSingle();
  if (owned) {
    return {
      supabase,
      userId: user.id,
      email: user.email ?? "",
      salon: owned as Salon,
      role: "owner",
      staffId: null,
    };
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("id, salon_id")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();
  if (!staff) redirect("/salon-yok");

  const { data: salon } = await supabase.from("salons").select("*").eq("id", staff.salon_id).maybeSingle();
  if (!salon) redirect("/salon-yok");

  return {
    supabase,
    userId: user.id,
    email: user.email ?? "",
    salon: salon as Salon,
    role: "staff",
    staffId: staff.id as string,
  };
}

export async function requireOwner(): Promise<PanelAccess> {
  const access = await getAccessContext();
  if (access.role !== "owner") redirect("/panel");
  return access;
}
