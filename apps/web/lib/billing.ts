import { hasSupabaseEnv } from "./supabase/env";
import { createClient } from "./supabase/server";

export type PublicPlan = {
  monthlyPriceKurus: number;
  trialDays: number;
};

export async function loadPublicPlan(): Promise<PublicPlan | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_public_plan");
    if (error || !Array.isArray(data) || data.length === 0) return null;
    const row = data[0] as { monthly_price_kurus?: number; trial_days?: number };
    if (typeof row.monthly_price_kurus !== "number" || typeof row.trial_days !== "number") return null;
    return { monthlyPriceKurus: row.monthly_price_kurus, trialDays: row.trial_days };
  } catch {
    return null;
  }
}
