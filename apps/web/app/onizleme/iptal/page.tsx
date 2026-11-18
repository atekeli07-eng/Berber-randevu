import { customerCancelHint } from "@berber/shared";
import { PublicHeader } from "@/components/public-header";

export default function PreviewCancelPage() {
  return (
    <div>
      <PublicHeader />
      <main className="mx-auto max-w-lg px-4 py-10">
        <p className="mb-4 rounded-2xl bg-warn-soft px-3 py-2 text-sm text-gold">Örnek ekran. Bu randevu kayıtlı değildir.</p>
        <p className="text-xs font-semibold tracking-[0.18em] text-gold">Sakal & Makas</p>
        <h1 className="mt-2 font-serif text-4xl">Randevunuz</h1>
        <dl className="mt-6 space-y-2 text-sm">
          <Row label="Ad" value="Ayşe Yılmaz" />
          <Row label="Hizmet" value="Saç kesimi" />
          <Row label="Berber" value="Emre Usta" />
          <Row label="Zaman" value="20 Kasım 2026 Cuma" />
          <Row label="Saat" value="10:30" />
          <Row label="Durum" value="Rezerve" />
        </dl>
        <p className="mt-4 text-sm text-muted">{customerCancelHint(3)}</p>
        <button type="button" className="mt-6 h-11 rounded-full bg-bad px-4 text-sm font-semibold text-card">
          Randevuyu iptal et
        </button>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
