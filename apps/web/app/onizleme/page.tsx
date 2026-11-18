import Link from "next/link";
import { PublicHeader } from "@/components/public-header";

export const metadata = {
  title: "Örnek ekranlar",
  robots: { index: false, follow: false },
};

export default function PreviewIndex() {
  return (
    <div>
      <PublicHeader />
      <main className="mx-auto max-w-lg space-y-4 px-5 py-8">
        <p className="text-xs font-semibold tracking-[0.18em] text-gold">ÖRNEK VERİ</p>
        <h1 className="font-serif text-4xl">Ekranlara bakın.</h1>
        <p className="text-sm text-muted">
          Bu sayfalar Supabase’e bağlı değildir. Gerçek randevu, salon kaydı açıldıktan sonra panelden yürür.
        </p>
        <div className="flex flex-col gap-2">
          <Link href="/onizleme/randevu" className="rounded-2xl border border-line bg-card px-4 py-4 font-semibold">
            Müşteri randevu akışı
          </Link>
          <Link href="/onizleme/panel" className="rounded-2xl border border-line bg-card px-4 py-4 font-semibold">
            Salon günü
          </Link>
        </div>
      </main>
    </div>
  );
}
