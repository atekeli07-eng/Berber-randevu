import { SUBSCRIPTION_STATUS_LABEL, formatTry, subscriptionStatus } from "@berber/shared";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApprovePayment, ExtendSalon, SuspendSalon } from "@/components/admin-controls";
import { Card } from "@/components/ui";
import { formatWhen, requireAdmin, type AdminPayment } from "@/lib/admin";

export const dynamic = "force-dynamic";

const PAYMENT_LABEL: Record<string, string> = {
  pending: "Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  failed: "Olmadı",
};

export default async function AdminSalonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: salon } = await supabase.from("salons").select("*").eq("id", id).maybeSingle();
  if (!salon) notFound();
  const { data: owner } = await supabase.rpc("admin_salon_rows");
  const rows = Array.isArray(owner) ? owner : [];
  const summary = rows.find((row) => row && typeof row === "object" && (row as { id?: string }).id === id) as
    | { owner_email?: string | null; phone?: string | null }
    | undefined;
  const status = subscriptionStatus({
    trialEndsAt: salon.trial_ends_at,
    paidUntil: salon.paid_until,
    suspended: salon.suspended,
  });
  const { data: payments } = await supabase.rpc("admin_salon_payments", { p_salon_id: id });
  const list = (Array.isArray(payments) ? payments : []) as AdminPayment[];

  return (
    <div className="space-y-4">
      <Link href="/admin/salonlar" className="text-sm font-semibold text-clay">Salonlar</Link>
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-gold">{SUBSCRIPTION_STATUS_LABEL[status].toUpperCase()}</p>
        <h1 className="font-serif text-4xl">{salon.name}</h1>
        <p className="mt-2 text-sm text-muted">
          {summary?.owner_email || "E-posta yok"} · {summary?.phone || salon.phone || "Telefon yok"} · kayıt {formatWhen(salon.created_at)}
        </p>
        <p className="text-sm text-muted">
          Kod {salon.payment_code} · deneme {formatWhen(salon.trial_ends_at)} · ödendi {formatWhen(salon.paid_until)}
        </p>
      </div>
      <Card className="space-y-3">
        <h2 className="font-serif text-2xl">Askı</h2>
        <SuspendSalon salonId={id} suspended={Boolean(salon.suspended)} />
      </Card>
      <Card>
        <h2 className="mb-3 font-serif text-2xl">Elle süre ekle</h2>
        <ExtendSalon salonId={id} />
      </Card>
      <Card>
        <h2 className="mb-3 font-serif text-2xl">Ödemeler</h2>
        {list.length === 0 ? <p className="text-sm text-muted">Kayıt yok.</p> : null}
        <ul className="space-y-4">
          {list.map((payment) => (
            <li key={payment.id} className="border-b border-line pb-4 last:border-0">
              <p className="text-sm">
                {formatTry(payment.amount_kurus)} · {payment.period_months} ay · {payment.method === "card" ? "Kart" : "Havale"}
                {payment.provider ? ` · ${payment.provider}` : ""} · {PAYMENT_LABEL[payment.status] ?? payment.status}
              </p>
              <p className="text-xs text-muted">{formatWhen(payment.created_at)} · açıklama {payment.reference}</p>
              {payment.note ? <p className="text-sm">{payment.note}</p> : null}
              {payment.status === "pending" ? (
                <div className="mt-2">
                  <ApprovePayment paymentId={payment.id} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
