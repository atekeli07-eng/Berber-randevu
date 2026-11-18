import { SUBSCRIPTION_STATUS_LABEL, type SubscriptionStatus } from "@berber/shared";
import Link from "next/link";
import { formatWhen, requireAdmin, type AdminSalonRow } from "@/lib/admin";
import { inputClass } from "@/components/ui";

export const dynamic = "force-dynamic";

const FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "Tümü" },
  { value: "trial", label: "Deneme" },
  { value: "active", label: "Aktif" },
  { value: "past_due", label: "Süresi doldu" },
  { value: "suspended", label: "Askıda" },
];

export default async function AdminSalonsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; durum?: string }>;
}) {
  const { q = "", durum = "" } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.rpc("admin_salon_rows");
  const rows = (Array.isArray(data) ? data : []) as AdminSalonRow[];
  const query = q.trim().toLocaleLowerCase("tr");
  const visible = rows.filter((row) => {
    const statusOk = !durum || row.status === durum;
    const haystack = `${row.name} ${row.slug} ${row.owner_email ?? ""} ${row.phone ?? ""} ${row.payment_code}`.toLocaleLowerCase("tr");
    return statusOk && (!query || haystack.includes(query));
  });

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-4xl">Salonlar</h1>
      <form className="flex flex-wrap gap-2" action="/admin/salonlar">
        <input name="q" defaultValue={q} placeholder="Ad, e-posta, telefon, kod" className={`${inputClass} max-w-xs`} />
        <select name="durum" defaultValue={durum} className={`${inputClass} max-w-[180px]`}>
          {FILTERS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <button className="h-12 rounded-full bg-clay px-4 text-sm font-semibold text-card" type="submit">Süz</button>
      </form>
      <div className="overflow-x-auto rounded-3xl border border-line bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Salon</th>
              <th className="px-4 py-3 font-medium">Sahip</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">Deneme / ödeme</th>
              <th className="px-4 py-3 font-medium">Son tahsilat</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <Link href={`/admin/salonlar/${row.id}`} className="font-semibold text-clay">{row.name}</Link>
                  <span className="block text-muted">{row.phone || "Telefon yok"} · {formatWhen(row.created_at)}</span>
                </td>
                <td className="px-4 py-3">{row.owner_email || "—"}</td>
                <td className="px-4 py-3">
                  {SUBSCRIPTION_STATUS_LABEL[row.status as SubscriptionStatus] ?? row.status}
                  {row.pending_count > 0 ? <span className="block text-gold">{row.pending_count} bekleyen</span> : null}
                </td>
                <td className="px-4 py-3">
                  {formatWhen(row.trial_ends_at)}
                  <span className="block text-muted">{formatWhen(row.paid_until)}</span>
                </td>
                <td className="px-4 py-3">{formatWhen(row.last_payment_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 ? <p className="px-4 py-6 text-sm text-muted">Salon yok.</p> : null}
      </div>
    </div>
  );
}
