import { PublicHeader } from "@/components/public-header";

export default function PrivacyPage() {
  return (
    <div>
      <PublicHeader />
      <main className="mx-auto max-w-2xl space-y-4 px-5 py-8 text-sm leading-6">
        <h1 className="font-serif text-4xl">Gizlilik politikası</h1>
        <p className="rounded-2xl bg-warn-soft px-3 py-2 text-gold">
          [DOLDURUN] Mağaza listelemesinde bu sayfayı kullanmadan önce şirket unvanı ve destek e-postasını değiştirin: Örnek Berber Yazılım Ltd. Şti. /
          destek@ornek.com
        </p>
        <p>
          Berber Randevu, salon sahiplerinin randevu defteridir. Mağazaya çıkmadan önce bu metindeki destek
          adresini kendi adresinizle değiştirin: destek@ornek.com
        </p>
        <h2 className="font-serif text-2xl">Salon hesabı</h2>
        <p>
          Salon sahibi e-posta ve şifreyle hesap açar. Şifre Supabase Auth üzerinde saklanır, uygulama şifreyi düz metin
          tutmaz. Logo ve kapak görseli Supabase Storage üzerinde, herkese açık bir kovada durur.
        </p>
        <h2 className="font-serif text-2xl">Müşteri randevusu</h2>
        <p>
          Müşteri hesap açmaz. Randevu için ad soyad ve cep telefonu istenir. Bu bilgiler yalnızca ilgili salon
          sahibi tarafından görülür. Bu sürümde SMS, WhatsApp veya e-posta gönderilmez.
        </p>
        <h2 className="font-serif text-2xl">Hesabı silmek</h2>
        <p>
          Salon panelinde Salon sayfasındaki “Hesabı ve salonu sil” adımı, mobil uygulamada ise Ayarlar ekranı
          salonu, ekibi, hizmetleri ve randevuları siler. İşlem geri alınamaz.
        </p>
      </main>
    </div>
  );
}
