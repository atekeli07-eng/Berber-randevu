import { formatTry } from "@berber/shared";
import Link from "next/link";
import { requireAdmin, type AdminDashboard } from "@/lib/admin";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.rpc("admin_dashboard");
  const stats = (data ?? {}) as Partial<AdminDashboard>;
  const cards = [
    ["Salon", stats.total ?? 0],
    ["Deneme", stats.trial ?? 0],
    ["Aktif", stats.active ?? 0],
    ["Süresi doldu", stats.past_due ?? 0],
    ["Askıda", stats.suspended ?? 0],
    ["Bekleyen ödeme", stats.pending_payments ?? 0],
  ] as const;

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-4xl">Özet</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-muted">{label}</p>
            <p className="font-serif text-3xl">{value}</p>
          </Card>
        ))}
      </div>
      <Card>
        <p className="text-sm text-muted">Bu ay onaylanan tahsilat</p>
        <p className="font-serif text-3xl">{formatTry(Number(stats.month_revenue_kurus ?? 0))}</p>
        <Link href="/admin/salonlar?durum=past_due" className="mt-3 inline-block text-sm font-semibold text-clay">
          Süresi dolanlar
        </Link>
      </Card>
    </div>
  );
}
