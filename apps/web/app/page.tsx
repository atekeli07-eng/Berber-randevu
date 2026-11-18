import { formatTry } from "@berber/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";
import { loadPublicPlan } from "@/lib/billing";
import { operator } from "@/lib/operator";

const title = "Berberimrandevu | Berber salonları için online randevu";
const description =
  "Erkek kuaförü ve berber salonları için randevu sayfası. Müşteri hesap açmadan gün ve saat seçer. 30 gün ücretsiz deneyin, kart gerekmez.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  keywords: ["berber randevu", "erkek kuaförü randevu", "berber yazılımı", "online randevu sistemi", "salon randevu"],
  openGraph: {
    title,
    description,
    locale: "tr_TR",
    type: "website",
  },
};

const benefits = [
  {
    title: "Randevu linki, gece de açık",
    text: "Salonunuza özel bir sayfa. Müşteri mesai bitince de, öğle arasında da saat seçer. Siz telefona bakmak zorunda kalmazsınız.",
  },
  {
    title: "Her berberin kendi günü",
    text: "Ustanın takvimi ayrı, kalfanın takvimi ayrı. Çalışma saati, öğle arası ve izin günü kişiye yazılır. Aynı saate iki kişi düşmez.",
  },
  {
    title: "Müşteri üye olmaz",
    text: "Hizmet, berber, gün ve saat. Sonra ad ve telefon. Uygulama indirme, şifre ve hesap yok.",
  },
  {
    title: "Telefonunuzda salon paneli",
    text: "iOS ve Android uygulaması salon sahibi içindir. Bugünün listesi, elle randevu ve kapatılan saat orada durur.",
  },
  {
    title: "Boş saat görünür",
    text: "Gün içinde kalan başlangıçlar listelenir. Müşteri dolu saati seçemez; sistem o aralığı kapatır.",
  },
  {
    title: "Telefon trafiği azalır",
    text: "“Saat var mı?” sorusu linke gider. Siz yalnızca gelen randevuyu görür, tamamlar veya iptal edersiniz.",
  },
];

const steps = [
  { n: "01", title: "Salonunuzu açın", text: "Ad, e-posta ve şifre. Hizmetleri, süreleri ve ekibi panelden yazın. Deneme hemen başlar." },
  { n: "02", title: "Linki paylaşın", text: "Sayfayı Instagram biyografisine, WhatsApp durumuna veya vitrine koyun. Müşteri oradan yazar." },
  { n: "03", title: "Günü telefondan görün", text: "Randevular sırayla düşer. Gelen müşteriyi arayın, işi bitince tamamlandı deyin." },
];

const questions = [
  {
    q: "KVKK tarafı nasıl?",
    a: "Müşteri randevu alırken aydınlatma metnini onaylar. Salon sahibi, bir telefona ait kayıtları panelden silebilir. Metin /kvkk adresindedir.",
  },
  {
    q: "Veriler nerede durur?",
    a: "Hesap şifresi düz metin saklanmaz. Bağlantı HTTPS üzerinden gider. Randevu kaydını salon sahibi ve o randevunun personeli görür.",
  },
  {
    q: "Nasıl iptal ederim?",
    a: "Deneme bitince karttan çekim olmaz. Devam etmek istemezseniz hesabı panelden silersiniz. Ödeme havale ile, siz bildirince onaylanır.",
  },
  {
    q: "Kaç personel ekleyebilirim?",
    a: "Ücret salon başına aylıktır. Ekipteki her berberin kendi takvimi olur; kişi başı ayrı ücret yoktur.",
  },
  {
    q: "Müşteri uygulama indirecek mi?",
    a: "Hayır. Müşteri web linkini açar. Telefon uygulaması salon sahibi ve personel içindir.",
  },
];

export default async function HomePage() {
  const info = operator();
  const plan = await loadPublicPlan();
  const trialDays = plan?.trialDays ?? 30;
  const priceLabel = plan && plan.monthlyPriceKurus > 0 ? formatTry(plan.monthlyPriceKurus) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Berberimrandevu",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    description,
    inLanguage: "tr",
    ...(priceLabel
      ? { offers: { "@type": "Offer", price: (plan!.monthlyPriceKurus / 100).toString(), priceCurrency: "TRY" } }
      : {}),
  };

  return (
    <div className="hero-wash">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicHeader />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-4 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-gold">BERBER VE ERKEK KUAFÖRÜ</p>
            <h1 className="mt-3 font-serif text-5xl leading-[1.02] md:text-6xl lg:text-7xl">
              Telefon çalmadan koltuk dolsun.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
              Berberimrandevu, salonunuzun randevu sayfasıdır. Müşteri hizmetini, berberini ve saatini kendisi seçer.
              Adı ve telefonu yeter. Siz günü listeden görürsünüz.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/kayit" className="rounded-full bg-clay px-6 py-3 text-sm font-semibold text-card">
                1 Ay Ücretsiz Dene
              </Link>
              <Link href="/giris" className="rounded-full border border-line bg-card px-6 py-3 text-sm font-semibold">
                Giriş Yap
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">Kart istenmez. Deneme {trialDays} gündür. Bitince havale ile devam edersiniz.</p>
          </div>
          <BookingMock />
        </section>

        <section id="faydalar" className="bg-card/60 py-16">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="max-w-xl font-serif text-4xl">Salonda işe yarayan tarafı</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {benefits.map((item) => (
                <article key={item.title} className="rounded-3xl border border-line bg-card p-5">
                  <h3 className="font-serif text-2xl">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="nasil" className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-serif text-4xl">Nasıl çalışır</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.n} className="rounded-3xl bg-bark p-6 text-card">
                <p className="text-xs tracking-[0.18em] text-gold">{step.n}</p>
                <h3 className="mt-3 font-serif text-2xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-card/70">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-card/60 py-16">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="font-serif text-4xl">Ekranlar</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Solda müşterinin gördüğü sayfa, ortada salon panelinin günü, sağda telefon uygulaması. Örnek bir gün; gerçek bir salonun verisi değildir.
            </p>
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <BookingMock compact />
              <DayMock />
              <PhoneAppMock />
            </div>
          </div>
        </section>

        <section id="ucret" className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid items-center gap-8 rounded-[2rem] bg-bark px-6 py-10 text-card md:grid-cols-[1.2fr_0.8fr] md:px-10">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-gold">{trialDays} GÜN DENEME</p>
              <h2 className="mt-3 font-serif text-4xl">Önce deneyin. Kart yok.</h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-card/75">
                Deneme bitince aylık ücret havale ile ödenir. Otomatik çekim yoktur. Ödeme yapılmazsa yeni randevu kapanır, yazılmış randevular durur.
              </p>
            </div>
            <div className="rounded-3xl bg-card p-6 text-ink">
              <p className="text-sm text-muted">Aylık, salon başına</p>
              <p className="mt-2 font-serif text-5xl">{priceLabel ?? "Fiyat yakında"}</p>
              <p className="mt-2 text-sm text-muted">Kişi başı ek ücret yok.</p>
              <Link href="/kayit" className="mt-6 inline-flex rounded-full bg-clay px-5 py-3 text-sm font-semibold text-card">
                1 Ay Ücretsiz Dene
              </Link>
            </div>
          </div>
        </section>

        <section id="sss" className="mx-auto max-w-3xl px-5 pb-16">
          <h2 className="font-serif text-4xl">Sorular</h2>
          <div className="mt-6 divide-y divide-line rounded-3xl border border-line bg-card">
            {questions.map((item) => (
              <details key={item.q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-semibold">{item.q}</summary>
                <p className="mt-2 text-sm leading-6 text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="rounded-[2rem] border border-line bg-card px-6 py-12 text-center md:px-16">
            <h2 className="font-serif text-4xl md:text-5xl">Bu akşam linki vitrine koyun.</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">
              Hizmetleri ve ekibi yazın. Müşteri kalan saati kendisi seçsin.
            </p>
            <Link href="/kayit" className="mt-8 inline-flex rounded-full bg-clay px-6 py-3 text-sm font-semibold text-card">
              1 Ay Ücretsiz Dene
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter operator={info} />
    </div>
  );
}

function BookingMock({ compact = false }: { compact?: boolean }) {
  return (
    <figure className={compact ? "" : "mx-auto w-full max-w-sm"}>
      <div className="rounded-[2rem] border border-ink/10 bg-bark p-3 shadow-[0_24px_60px_rgba(36,28,23,0.16)]">
        <div className="rounded-[1.5rem] bg-paper p-4">
          <p className="text-[11px] tracking-[0.18em] text-gold">MÜŞTERİ SAYFASI</p>
          <p className="mt-1 font-serif text-3xl">Saat seçin</p>
          <p className="text-sm text-muted">Saç kesimi · 30 dk · Kerem</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {["10:00", "10:30", "11:15", "14:00", "16:30", "18:00"].map((hour, index) => (
              <div
                key={hour}
                className={`rounded-2xl py-3 text-center text-sm font-semibold ${index === 3 ? "bg-clay text-card" : "border border-line bg-card"}`}
              >
                {hour}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-line bg-card px-3 py-3 text-sm">
            <p className="text-muted">Ad ve telefon</p>
            <p className="font-semibold">Son adımda istenir</p>
          </div>
        </div>
      </div>
      {compact ? <figcaption className="mt-3 text-sm text-muted">Müşterinin randevu sayfası</figcaption> : null}
    </figure>
  );
}

function DayMock() {
  const rows = [
    ["09:30", "Burak Demir", "Saç"],
    ["11:00", "Emre Yılmaz", "Sakal"],
    ["14:30", "Boş", ""],
  ];
  return (
    <figure>
      <div className="rounded-[2rem] border border-line bg-paper p-4">
        <p className="text-[11px] tracking-[0.18em] text-gold">SALON PANELİ</p>
        <p className="mt-1 font-serif text-3xl">Bugün</p>
        <ul className="mt-4 space-y-2">
          {rows.map(([time, name, service]) => (
            <li key={time} className="flex items-center justify-between rounded-2xl border border-line bg-card px-3 py-3 text-sm">
              <span>
                <span className="font-semibold">{time}</span>
                <span className="ml-2">{name}</span>
              </span>
              <span className="text-muted">{service}</span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="mt-3 text-sm text-muted">Günün listesi</figcaption>
    </figure>
  );
}

function PhoneAppMock() {
  return (
    <figure>
      <div className="mx-auto w-full max-w-[260px] rounded-[2rem] border border-ink/10 bg-bark p-3">
        <div className="rounded-[1.4rem] bg-paper p-4">
          <p className="text-[11px] tracking-[0.16em] text-gold">UYGULAMA</p>
          <p className="mt-1 font-serif text-2xl">Kerem</p>
          <p className="text-sm text-muted">Deneme · günler kaldı</p>
          <div className="mt-4 space-y-2 text-sm">
            <p className="rounded-2xl bg-card px-3 py-2">10:00 Emre · saç</p>
            <p className="rounded-2xl bg-card px-3 py-2">11:15 Mehmet · sakal</p>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-muted">Salon sahibinin telefonu</figcaption>
    </figure>
  );
}
