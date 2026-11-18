import type { SubscriptionStatus } from "@berber/shared";
import { notFound, redirect } from "next/navigation";
import { hasSupabaseEnv } from "./supabase/env";
import { createClient } from "./supabase/server";

export type AdminDashboard = {
  total: number;
  trial: number;
  active: number;
  past_due: number;
  suspended: number;
  pending_payments: number;
  month_revenue_kurus: number;
};

export type AdminSalonRow = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  payment_code: string;
  created_at: string;
  trial_ends_at: string;
  paid_until: string | null;
  suspended: boolean;
  owner_email: string | null;
  status: SubscriptionStatus;
  last_payment_at: string | null;
  pending_count: number;
};

export type AdminPayment = {
  id: string;
  method: string;
  provider: string | null;
  amount_kurus: number;
  period_months: number;
  status: string;
  reference: string;
  note: string | null;
  reported_at: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export async function requireAdmin() {
  if (!hasSupabaseEnv()) redirect("/giris?yapilandirma=1");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");
  const { data, error } = await supabase.rpc("is_platform_admin");
  if (error || data !== true) notFound();
  return { supabase, email: user.email ?? "" };
}

export function formatWhen(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}
