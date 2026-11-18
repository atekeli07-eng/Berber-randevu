import { formatIban, formatTry, SUBSCRIPTION_STATUS_LABEL, accessEndsAt, subscriptionStatus, wholeDaysLeft } from "@berber/shared";
import { PaymentReport } from "@/components/payment-report";
import { Card, Notice } from "@/components/ui";
import { requireOwner } from "@/lib/owner";

export const dynamic = "force-dynamic";

type PaymentRow = {
  id: string;
  amount_kurus: number;
  period_months: number;
  status: string;
  reference: string;
  note: string | null;
  created_at: string;
};

const PAYMENT_LABEL: Record<string, string> = {
  pending: "Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  failed: "Olmadı",
};

function when(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export default async function SubscriptionPage() {
  const { supabase, salon } = await requireOwner();
  const billing = {
    trialEndsAt: salon.trial_ends_at,
    paidUntil: salon.paid_until,
    suspended: salon.suspended,
  };
  const status = subscriptionStatus(billing);
  const end = accessEndsAt(billing);
  const days = end ? wholeDaysLeft(end) : 0;
  const { data: settings } = await supabase.from("platform_settings").select("*").eq("id", 1).maybeSingle();
  const price = Number(settings?.monthly_price_kurus ?? 0);
  const iban = String(settings?.iban ?? "");
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount_kurus, period_months, status, reference, note, created_at")
    .eq("salon_id", salon.id)
    .order("created_at", { ascending: false });
  const rows = (payments ?? []) as PaymentRow[];
  const waiting = rows.some((row) => row.status === "pending");

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-gold">{SUBSCRIPTION_STATUS_LABEL[status].toUpperCase()}</p>
        <h1 className="font-serif text-4xl">Abonelik</h1>
        <p className="mt-2 text-sm text-muted">
          {status === "trial" || status === "active"
            ? `${SUBSCRIPTION_STATUS_LABEL[status]} · ${days} gün kaldı · bitiş ${when(end?.toISOString())}`
            : status === "suspended"
              ? "Salon askıda. Yeni randevu kapalı."
              : "Süre doldu. Havale onaylanınca online randevu yeniden açılır."}
        </p>
      </div>

      <Card className="space-y-2">
        <p className="text-sm text-muted">Aylık ücret</p>
        <p className="font-serif text-3xl">{price > 0 ? formatTry(price) : "Henüz belirlenmedi"}</p>
        <p className="text-sm">Havale açıklamasına bu kodu yazın</p>
        <p className="font-mono text-2xl tracking-wide">{salon.payment_code ?? salon.slug}</p>
      </Card>

      <Card className="space-y-2 text-sm">
        <p><span className="text-muted">Hesap sahibi: </span>{settings?.account_holder || "—"}</p>
        <p><span className="text-muted">Banka: </span>{settings?.bank_name || "—"}</p>
        <p><span className="text-muted">IBAN: </span>{iban ? formatIban(iban) : "—"}</p>
        {!iban || price <= 0 ? <Notice tone="warn">Ödeme bilgisi eksik. Kurucu paneli fiyat ve IBAN girince burada görünür.</Notice> : null}
      </Card>

      <Card>
        <h2 className="font-serif text-2xl">Ödeme bildirimi</h2>
        <p className="mt-2 mb-4 text-sm text-muted">Havaleyi yaptıktan sonra bildirin. Kart çekimi bu sürümde yok.</p>
        <PaymentReport disabled={waiting || price <= 0} />
        {waiting ? <p className="mt-3 text-sm text-muted">Bekleyen bildiriminiz var. Yenisi, o sonuçlanınca açılır.</p> : null}
      </Card>

      {rows.length > 0 ? (
        <Card>
          <h2 className="mb-3 font-serif text-2xl">Bildirimler</h2>
          <ul className="space-y-3 text-sm">
            {rows.map((row) => (
              <li key={row.id} className="flex items-baseline justify-between gap-3 border-b border-line pb-3 last:border-0">
                <span>
                  {formatTry(row.amount_kurus)} · {row.period_months} ay · {when(row.created_at)}
                  {row.note ? <span className="block text-muted">{row.note}</span> : null}
                </span>
                <span className="font-semibold">{PAYMENT_LABEL[row.status] ?? row.status}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
