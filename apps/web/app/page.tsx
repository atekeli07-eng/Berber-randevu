import Link from "next/link";
import { PublicHeader } from "@/components/public-header";

export default function HomePage() {
  return (
    <div className="hero-wash min-h-screen">
      <PublicHeader />
      <main className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-10 md:grid-cols-[1.1fr_0.9fr] md:py-16">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-gold">İSTANBUL SAATİYLE</p>
          <h1 className="mt-3 font-serif text-5xl leading-[1.05] md:text-7xl">
            Koltuk boş kalmasın.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Salonunuz bir bağlantı paylaşır. Müşteri hizmetini, berberini, gününü ve saatini seçer. Adı ve telefonu yeter.
            Aynı saate iki kişi yazılmaz.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/kayit" className="rounded-full bg-clay px-5 py-3 text-sm font-semibold text-card">
              Salonu kaydet
            </Link>
            <Link href="/giris" className="rounded-full border border-line bg-card px-5 py-3 text-sm font-semibold">
              Panele gir
            </Link>
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-3 text-sm">
            <Fact title="Hesapsız" text="Müşteri üye olmaz" />
            <Fact title="Çakışmaz" text="Saat veritabanında kilitlenir" />
            <Fact title="Ekip" text="Her berberin kendi günü" />
          </dl>
        </div>
        <PhonePreview />
      </main>
      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-10 md:grid-cols-3">
        <Feature title="Hizmetler" text="Ad, süre ve fiyat. Süre, açılan saatlerin boyunu belirler." />
        <Feature title="Çalışma düzeni" text="Haftalık saat, öğle arası ve izin günü. Pazar kapalı başlar." />
        <Feature title="Gün akışı" text="Listede veya gün şeridinde görün. Tamamlandı deyin ya da iptal edin." />
      </section>
      <footer className="mx-auto flex max-w-6xl flex-wrap gap-4 px-5 pb-10 text-sm text-muted">
        <Link href="/gizlilik">Gizlilik</Link>
        <Link href="/onizleme">Örnek ekranlar</Link>
      </footer>
    </div>
  );
}

function Fact({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-line bg-card/80 p-3">
      <dt className="font-semibold">{title}</dt>
      <dd className="text-muted">{text}</dd>
    </div>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-3xl border border-line bg-card p-5">
      <h2 className="font-serif text-2xl">{title}</h2>
      <p className="mt-2 text-sm text-muted">{text}</p>
    </article>
  );
}

function PhonePreview() {
  return (
    <div className="mx-auto w-full max-w-sm rounded-[2.2rem] border border-ink/10 bg-bark p-3 shadow-[0_30px_80px_rgba(36,28,23,0.18)]">
      <div className="rounded-[1.7rem] bg-paper p-4">
        <p className="text-[11px] tracking-[0.18em] text-gold">SAKAL & MAKAS</p>
        <p className="mt-1 font-serif text-3xl">Saat</p>
        <p className="text-sm text-muted">Emre Usta · saç kesimi · 30 dk</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {["10:00", "10:15", "11:30", "14:00", "14:30", "18:45"].map((hour, index) => (
            <div
              key={hour}
              className={`rounded-2xl py-3 text-center text-sm font-semibold ${index === 3 ? "bg-clay text-card" : "border border-line bg-card"}`}
            >
              {hour}
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-card px-3 py-3 text-sm">
          <p className="text-muted">Ad soyad</p>
          <p className="font-semibold">Mert Aydın</p>
        </div>
      </div>
    </div>
  );
}
