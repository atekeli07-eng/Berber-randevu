import type { Operator } from "@/lib/operator";
import Link from "next/link";

export function SiteFooter({ operator }: { operator: Operator }) {
  return (
    <footer className="border-t border-line bg-bark text-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-serif text-2xl">Berberimrandevu</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-card/70">
            Erkek kuaförü ve berber salonları için randevu sayfası. Müşteri hesap açmaz; siz günü telefondan görürsünüz.
          </p>
        </div>
        <div className="text-sm leading-6">
          <p className="font-semibold">{operator.companyName || "Berberimrandevu"}</p>
          {operator.address ? <p className="mt-2 text-card/70">{operator.address}</p> : null}
          {operator.contactEmail ? (
            <a className="mt-2 inline-block text-card underline" href={`mailto:${operator.contactEmail}`}>
              {operator.contactEmail}
            </a>
          ) : (
            <p className="mt-2 text-card/50">İletişim adresi yayında eklenecek.</p>
          )}
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/gizlilik" className="text-card/80 hover:text-card">Gizlilik</Link>
          <Link href="/kvkk" className="text-card/80 hover:text-card">KVKK</Link>
          <Link href="/kosullar" className="text-card/80 hover:text-card">Kullanım koşulları</Link>
          <Link href="/giris" className="text-card/80 hover:text-card">Giriş yap</Link>
        </nav>
      </div>
    </footer>
  );
}
