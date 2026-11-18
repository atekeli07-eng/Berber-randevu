# Mağaza listesi (Türkçe)

Metinleri App Store Connect ve Google Play Console’a olduğu gibi yapıştırın. Köşeli yerleri kendi sitenizle değiştirin.

## Ortak

| Alan | Değer |
| --- | --- |
| Uygulama adı | Berberimrandevu |
| Paket / bundle | `com.berberimrandevu.app` |
| Birincil dil | Türkçe |
| Kategori | İş (Business). İkincil, varsa Yaşam tarzı. |
| Destek URL | `https://ALANADINIZ/gizlilik` |
| Destek e-postası | `NEXT_PUBLIC_CONTACT_EMAIL` ile aynı adres |
| Gizlilik politikası | `https://ALANADINIZ/gizlilik` |
| Kullanım koşulları | `https://ALANADINIZ/kosullar` |
| KVKK | `https://ALANADINIZ/kvkk` |
| Pazarlama adresi | Web sitesinin kök adresi |

## Apple

Alt başlık en fazla 30 karakter: **Berber randevu defteri** (22).

Anahtar kelimeler, 100 karakter sınırı, virgülle, boşluksuz:

`berber,randevu,salon,kuaför,takvim,traş,berberim,defter,rezervasyon`

Tanıtım metni:

Berberimrandevu, salon sahibinin cebindeki randevu defteridir. Müşteri hesap açmaz; web bağlantısından gün ve saat seçer. Siz günü, ekibi ve hizmeti telefondan görürsünüz.

Açıklama:

Berberimrandevu, Türkiye’deki berber salonları için randevu defteridir. Saatler İstanbul saatine göredir.

Salon sahibi uygulamadan:
- Bugünün randevularını ve berbere göre boş saatleri görür
- Telefon veya kapıdan gelen müşteriyi elle yazar
- Bir saati kapatır
- Randevuyu tamamlandı işaretler veya iptal eder
- Hizmet ekler, süresini ve fiyatını değiştirir
- Salon adı, adres, telefon, logo ve kapak görselini günceller
- Hesabını ve salonu siler

Müşteri bu uygulamayı kullanmaz. Randevusunu salonun web bağlantısından alır: hizmet, berber, gün ve saat seçer, adını ve telefonunu bırakır. Aynı saate iki kişi yazılmaz.

Personel hesabı yalnızca kendi randevularını görür. Bu sürümde SMS, WhatsApp veya e-posta bildirimi gitmez.

Yaş sınırı: 4+. Çocuklara yönelik değildir. Şiddet, cinsellik, kumar, korku, küfür veya kısıtlanmamış web tarayıcısı yoktur.

### Apple gizlilik etiketi

Takip yok. Reklam yok. Veriler üçüncü tarafa satılmaz. Supabase, uygulamayı çalıştıran altyapıdır; “veri paylaşımı” sayılmaz.

| Veri | Kimden | Bağlı mı | Amaç | İzleme |
| --- | --- | --- | --- | --- |
| İsim | Müşteri randevusu (ad soyad). Salon sahibi ve personelin görünen adı. | Evet, kullanıcının kaydıyla | Uygulama işlevi | Hayır |
| Telefon numarası | Müşteri randevusu | Evet | Uygulama işlevi | Hayır |
| E-posta adresi | Salon sahibi hesabı ve personel daveti | Evet | Uygulama işlevi, hesap yönetimi | Hayır |
| Fotoğraflar | Salon sahibi logo veya kapak seçerse | Evet | Uygulama işlevi | Hayır |

Sorularda Hayır denenler: konum, sağlık, finansal bilgi, ödeme, kişiler rehberi, tarama geçmişi, arama geçmişi, kullanıcı kimliği dışında reklam kimliği, satın alma geçmişi, hassas bilgi, ses, müşteri desteği sohbeti, ürün etkileşimi, çökme verisi, performans verisi, tanılama.

Fotoğraf izni yalnızca logo ve kapak içindir. Konum izni istenmez. Harita alanı, salon sahibinin yapıştırdığı bir bağlantıdır.

Hesap silme: Ayarlar → Hesabı ve salonu sil. Müşteri kaydı, salon panelinden telefon numarasıyla anonimleştirilir.

### Yaş derecelendirme soruları

| Soru | Yanıt |
| --- | --- |
| Çizgi film veya fantastik şiddet | Yok |
| Gerçekçi şiddet | Yok |
| Cinsel içerik veya çıplaklık | Yok |
| Küfür veya kaba mizah | Yok |
| Korku veya korkutucu temalar | Yok |
| Alkol, tütün, uyuşturucu | Yok |
| Olgun veya müstehcen temalar | Yok |
| Kumar | Yok |
| Yarışmalar | Yok |
| Kısıtlanmamış web erişimi | Hayır |
| Kullanıcıların ürettiği içerik var mı | Evet, salon adı ve tanıtım metni. Önceden süzülmez. Sık değil. |
| Çocuklar için yapıldı mı | Hayır |
| Sonuç | 4+ |

## Google Play

Kısa açıklama, 80 karakter: **Berber salonu için randevu defteri. Müşteri hesap açmadan gün ve saat seçer.** (76)

Tam açıklama, Apple açıklamasıyla aynı metni kullanın.

Uygulama türü: Uygulama. Kategori: İş. Etiket: Randevu.

İçerik derecelendirmesi: Herkes. Şiddet, cinsellik, küfür, kumar, korku yok. Çocuklara yönelik değildir.

### Veri güvenliği

Veri toplanıyor mu: Evet.
Veri paylaşılıyor mu: Hayır. Supabase hizmet sağlayıcıdır, Play’in “paylaşım” tanımına girmez.
Veri aktarımda şifreli mi: Evet (HTTPS).
Kullanıcı silme isteyebilir mi: Evet. Uygulama içinden hesap silinir.

| Veri türü | Zorunlu mu | Amaç |
| --- | --- | --- |
| Ad | Randevu için zorunlu | Uygulama işlevi |
| E-posta | Salon ve personel hesabı için zorunlu | Hesap yönetimi, uygulama işlevi |
| Telefon numarası | Müşteri randevusu için zorunlu. Elle girilen randevuda boş kalabilir. | Uygulama işlevi |
| Fotoğraflar | İsteğe bağlı | Uygulama işlevi |

Toplanmayanlar: konum, finansal bilgi, reklam kimliği, uygulama etkinliği, uygulama içi arama, web tarama, ses, dosya, takvim, kişiler, sağlık, mesaj, çökme günlüğü, tanılama.

Reklam veya pazarlama için kullanılmaz. Analitik SDK yoktur.
