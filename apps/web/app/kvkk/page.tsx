import { KVKK_CONSENT_VERSION } from "@berber/shared";
import { PublicHeader } from "@/components/public-header";
import { operator } from "@/lib/operator";

export default function KvkkPage() {
  const info = operator();
  return (
    <div>
      <PublicHeader />
      <main className="mx-auto max-w-2xl space-y-4 px-5 py-8 text-sm leading-6">
        <p className="text-xs font-semibold tracking-[0.16em] text-gold">SÜRÜM {KVKK_CONSENT_VERSION}</p>
        <h1 className="font-serif text-4xl">KVKK aydınlatma metni</h1>
        <p>Bu metin Berberimrandevu uygulaması ve web sitesi için hazırlanmıştır.</p>
        {info.ready ? (
          <p>
            Veri sorumlusu: {info.companyName}. Adres: {info.address}. İletişim: {info.kvkkEmail}
          </p>
        ) : (
          <p className="rounded-2xl bg-warn-soft px-3 py-2 text-gold">
            Şirket bilgisi henüz yok. Vercel ortam değişkenlerinden okunur: {info.missing.join(", ")}.
          </p>
        )}
        <h2 className="font-serif text-2xl">Hangi veriler işlenir?</h2>
        <p>
          Randevu için ad soyad ve cep telefonu istenir. Salon sahibi ve davet edilen personel hesabında e-posta adresi bulunur. İşlem zamanı ve
          onay kaydı tutulur. Şifre düz metin olarak saklanmaz.
        </p>
        <h2 className="font-serif text-2xl">Amaç ve hukuki sebep</h2>
        <p>
          Veriler randevunun oluşturulması, çakışmanın önlenmesi ve salonun hizmeti sunması için, KVKK m.5/2-c (sözleşmenin kurulması) ve açık rızanız
          kapsamında işlenir. Bu sürümde SMS, WhatsApp veya e-posta ile bilgilendirme yapılmaz.
        </p>
        <h2 className="font-serif text-2xl">Aktarım ve süre</h2>
        <p>
          Veriler Supabase altyapısında, salon sahibi ve yetkili personel tarafından görülür. Randevu kaydı, yasal saklama süresi veya silme talebiniz
          dolana kadar tutulur.
        </p>
        <h2 className="font-serif text-2xl">Haklarınız</h2>
        <p>
          KVKK m.11 kapsamındaki haklarınız için {info.kvkkEmail || "KVKK e-posta adresine"} yazabilir veya salondan müşteri verinizin silinmesini
          isteyebilirsiniz. Salon paneli, telefon numarasına bağlı kayıtları anonimleştirir.
        </p>
      </main>
    </div>
  );
}
