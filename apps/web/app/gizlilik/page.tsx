import { PublicHeader } from "@/components/public-header";
import { operator } from "@/lib/operator";

export default function PrivacyPage() {
  const info = operator();
  return (
    <div>
      <PublicHeader />
      <main className="mx-auto max-w-2xl space-y-4 px-5 py-8 text-sm leading-6">
        <h1 className="font-serif text-4xl">Gizlilik politikası</h1>
        {info.ready ? (
          <p>
            Bu hizmeti {info.companyName} sunar. Destek: {info.contactEmail}. Adres: {info.address}.
          </p>
        ) : (
          <p className="rounded-2xl bg-warn-soft px-3 py-2 text-gold">
            Şirket bilgisi henüz yok. Vercel ortam değişkenlerinden okunur: {info.missing.join(", ")}.
          </p>
        )}
        <p>Berberimrandevu, salon sahiplerinin randevu defteridir. Müşteri bu siteden hesap açmaz.</p>
        <h2 className="font-serif text-2xl">Salon hesabı</h2>
        <p>
          Salon sahibi ve davet edilen personel e-posta ve şifreyle hesap açar. Şifre Supabase Auth üzerinde saklanır, uygulama şifreyi düz metin
          tutmaz. Logo ve kapak görseli, salon sahibi seçerse Supabase Storage üzerinde herkese açık bir kovada durur.
        </p>
        <h2 className="font-serif text-2xl">Müşteri randevusu</h2>
        <p>
          Müşteri hesap açmaz. Randevu için ad soyad ve cep telefonu istenir. Bu bilgiler ilgili salon sahibi ve o randevunun personeli tarafından
          görülür. Bu sürümde SMS, WhatsApp veya e-posta gönderilmez.
        </p>
        <h2 className="font-serif text-2xl">Hesabı silmek</h2>
        <p>
          Salon panelinde Salon sayfasındaki “Hesabı ve salonu sil” adımı, mobil uygulamada ise Ayarlar ekranı salonu, ekibi, hizmetleri ve randevuları
          siler. İşlem geri alınamaz. KVKK başvuruları için {info.kvkkEmail || "KVKK e-posta adresini"} kullanın.
        </p>
      </main>
    </div>
  );
}
