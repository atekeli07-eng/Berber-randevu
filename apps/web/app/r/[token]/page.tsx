import { customerCancelHint, formatLongDate, formatSlotTime } from "@berber/shared";
import { notFound } from "next/navigation";
import { CancelActions } from "@/components/cancel-actions";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ManageAppointmentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!hasSupabaseEnv()) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_appointment", { p_token: token });
  if (error || !data) notFound();
  const row = data as {
    starts_at: string;
    ends_at: string;
    status: string;
    customer_name: string;
    salon_name: string;
    staff_name: string;
    service_name: string | null;
    timezone: string;
    cancellation_cutoff_hours: number;
  };
  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <p className="text-xs font-semibold tracking-[0.18em] text-gold">{row.salon_name}</p>
      <h1 className="mt-2 font-serif text-4xl">Randevunuz</h1>
      <dl className="mt-6 space-y-2 text-sm">
        <Line label="Ad" value={row.customer_name} />
        <Line label="Hizmet" value={row.service_name ?? "—"} />
        <Line label="Berber" value={row.staff_name} />
        <Line label="Zaman" value={formatLongDate(new Date(row.starts_at), row.timezone)} />
        <Line label="Saat" value={formatSlotTime(new Date(row.starts_at), row.timezone)} />
        <Line label="Durum" value={row.status === "booked" ? "Rezerve" : row.status === "done" ? "Tamamlandı" : "İptal"} />
      </dl>
      <p className="mt-4 text-sm text-muted">{customerCancelHint(row.cancellation_cutoff_hours)}</p>
      <CancelActions token={token} status={row.status} startsAt={row.starts_at} cutoffHours={row.cancellation_cutoff_hours} />
    </main>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
