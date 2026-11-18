import { PublicHeader } from "@/components/public-header";
import { operator } from "@/lib/operator";

export default function TermsPage() {
  const info = operator();
  return (
    <div>
      <PublicHeader />
      <main className="mx-auto max-w-2xl space-y-4 px-5 py-8 text-sm leading-6">
        <h1 className="font-serif text-4xl">Kullanım koşulları</h1>
        {info.ready ? (
          <p>
            Berberimrandevu, {info.companyName} tarafından sunulan bir salon randevu aracıdır. İletişim: {info.contactEmail}. Adres: {info.address}.
          </p>
        ) : (
          <p className="rounded-2xl bg-warn-soft px-3 py-2 text-gold">
            Şirket bilgisi henüz yok. Vercel ortam değişkenlerinden okunur: {info.missing.join(", ")}.
          </p>
        )}
        <h2 className="font-serif text-2xl">Hesaplar</h2>
        <p>
          Salon sahibi ve davet edilen personel e-posta ile giriş yapar. Müşteri hesap açmaz. Hesabınızı panelden veya uygulamadaki Ayarlar ekranından
          silebilirsiniz.
        </p>
        <h2 className="font-serif text-2xl">Randevu</h2>
        <p>
          Müsait saatler çalışma düzenine ve mevcut kayıtlara göre hesaplanır. İptal, salonun belirlediği süreden önce ve size verilen bağlantıyla
          yapılabilir. Geç iptal için salona başvurun.
        </p>
        <h2 className="font-serif text-2xl">Sorumluluk</h2>
        <p>
          Hizmetin içeriğinden ve randevuya gelinmemesinden salon sorumludur. Yazılım, bildirimi bu sürümde SMS veya e-posta ile iletmez. Bağlantınızı
          saklamanız gerekir.
        </p>
      </main>
    </div>
  );
}
