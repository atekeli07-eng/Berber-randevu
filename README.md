# Berberimrandevu

Türkiye’deki berber salonları için randevu defteri. Salon sahibi panele girer, hizmetlerini ve ekibini tanımlar, müşterisine tek bir bağlantı verir. Müşteri hesap açmaz; hizmet, berber, gün ve saat seçip adını ve telefonunu bırakır.

Saatler `Europe/Istanbul` saat dilimindedir. Aynı personele aynı aralık iki kez yazılamaz; bu kural hem ekranda hem veritabanında durur.

Bu sürümde müşteriye SMS, WhatsApp veya e-posta gitmez. Gönderim için kuyruk tabloları hazırdır, worker yoktur.

Yayına almak için adım adım anlatım: [docs/YAYINA-ALMA.md](docs/YAYINA-ALMA.md). Mağaza metinleri `docs/store` altındadır.

## Neler var

- `apps/web` — Next.js paneli ve herkese açık randevu sayfası (`/s/<salon-slug>`).
- `apps/mobile` — Expo ile salon paneli. App Store ve Google Play’e çıkacak şekilde ayarlıdır. Müşteri akışı yoktur.
- `packages/shared` — tipler, saat hesabı, telefon ve fiyat doğrulaması. Web ve mobil aynı paketi kullanır.
- `supabase/migrations` — tablolar, satır düzeyi güvenlik ve randevu fonksiyonları.

## Gerekenler

- Node.js 22 veya daha yenisi
- pnpm 10 (`corepack enable` ardından `corepack prepare pnpm@10.33.4 --activate`)
- Bir Supabase hesabı
- Mobil mağaza için ayrıca Expo hesabı, Apple Developer hesabı ve Google Play Console hesabı

## 1. Bağımlılıkları kurun

Depo kökünde:

```bash
pnpm install
```

## 2. Supabase projesi açın

1. [supabase.com](https://supabase.com) üzerinde yeni bir proje oluşturun. Bölge olarak Avrupa’yı seçmek İstanbul’a daha yakındır.
2. Proje açılınca **Project Settings → API** ekranından şunları kopyalayın:
   - Project URL
   - `anon` `public` anahtarı
3. `service_role` anahtarını bu uygulamalara koymayın. Panel ve randevu sayfası yalnızca anon anahtar ile, yetkiler veritabanı kurallarıyla çalışır.

## 3. Migrasyonu çalıştırın

1. Supabase panosunda **SQL Editor**’ü açın.
2. `supabase/setup.sql` dosyasının tamamını yapıştırıp bir kez çalıştırın. Bu dosya üç migrasyonu sırayla uygular: ilk kurulum, salon profili ve görseller, yayın kuralları (spam sınırı, müşteri iptali, KVKK onayı, manuel randevu, saat kapatma, personel hesapları).
3. Aynı işi komut satırından yapmak isterseniz `supabase link` ardından `supabase db push`. `main` dalına her gönderimde GitHub Action da `db push` çalıştırır; sırlar yoksa adımı atlar. Adım adım anlatım `docs/YAYINA-ALMA.md` içindedir.

Bu dosya şunları kurar:

- `salons`, `services`, `staff`, `working_hours`, `days_off`, `appointments`
- Aynı personelde çakışan randevuyu reddeden exclusion constraint
- Yeni personele pazartesi–cumartesi 09:00–19:00 saatlerini yazan tetikleyici
- Kayıt olan kullanıcı için salon satırı açan tetikleyici (`auth.users`)
- Müşterinin görebileceği dolu saat aralıkları: `get_salon_busy_ranges` (ad ve telefon dönmez)
- Randevuyu doğrulayıp yazan `book_appointment`
- Haftalık saatleri tek seferde değiştiren `replace_working_hours`
- Hesabı silen `delete_owner_account`
- Salon verisini yalnızca sahibinin değiştirebildiği RLS
- İleride SMS / WhatsApp / e-posta için `notification_settings` ve `notification_outbox`
- İkinci migrasyon: ilçe, harita, Instagram, çalışma saati özeti, logo ve kapak; `salon-media` kovası
- Üçüncü migrasyon `20261118160000_launch_rules.sql`: telefon ve IP sınırı, müşteri iptal bağlantısı, KVKK onayı, manuel randevu ve saat kapatma, personel daveti ve rol bazlı RLS

CLI kullanıyorsanız proje kökünde `supabase link` ve `supabase db push` aynı şemayı `supabase/migrations` dosyalarından kurar. `setup.sql` ile kurulumu yaptıysanız `db push` bu üç dosyayı atlar. Yerel Docker şart değildir.

Abonelik migrasyonu `supabase/migrations/20261118200000_subscriptions.sql` dosyasıdır. `setup.sql` bunu içermez; SQL Editor’de bu dosyayı da bir kez çalıştırın. Yeni salon 30 gün dener. Süre `platform_settings` tablosundaki ücret, IBAN ve deneme gününden okunur. Kurucu, kendi e-postasıyla kayıt olduktan sonra şunu çalıştırır:

```sql
select public.grant_platform_admin('atekeli07@gmail.com');
```

Ardından `/admin` adresinden ücreti ve IBAN’ı kaydeder. Ayrıntı `docs/YAYINA-ALMA.md` içindedir.

Yerel geliştirmede Turnstile anahtarlarını boş bırakın; doğrulama kutusu görünmez ve randevu RPC’si bilet istemez. Üretimde `apps/web/.env.example` içindeki üç değişkeni doldurun ve aynı bilet sırrını `private.settings` tablosuna yazın. Aksi halde ya doğrulama kapalı kalır ya da randevu kaydı reddedilir.

Herkese açık sayfalar: `/kvkk` aydınlatma metni, `/gizlilik` gizlilik politikası, `/kosullar` kullanım koşulları. Şirket unvanı, adres ve e-postalar sayfalara yazılmaz; `apps/web/.env.example` içindeki `NEXT_PUBLIC_COMPANY_NAME`, `NEXT_PUBLIC_COMPANY_ADDRESS`, `NEXT_PUBLIC_CONTACT_EMAIL` ve `NEXT_PUBLIC_KVKK_EMAIL` değişkenlerinden okunur. Müşteri randevu formunda aydınlatma onayı zorunludur. Salon sahibi, Salon sayfasından bir telefona ait müşteri verisini silebilir.

Personel daveti e-posta göndermez. Salon sahibi personel sayfasından bağlantı üretir ve iletir. Personel o e-postayla hesap açınca yalnızca kendi takvimini görür. Üretimde Supabase e-posta onayını açık tutun.

## 4. Auth ayarı

**Authentication → Providers → Email** açık kalsın.

Geliştirmede hemen panele düşmek için **Confirm email** seçeneğini kapatın. Açık bırakırsanız kayıt sonrası e-postadaki bağlantı onaylanmadan oturum açılmaz; ekran bunu söyler.

**Authentication → URL Configuration**

- Site URL: `http://localhost:3000` (yayında kendi alan adınız)
- Redirect URLs: `http://localhost:3000/**` ve yayındaki adres

Şifre en az 8 karakter istenir. Bunu **Authentication → Policies** altında da 8’e çekebilirsiniz.

## 5. Ortam değişkenleri

Web:

```bash
cp apps/web/.env.example apps/web/.env.local
```

`apps/web/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://PROJE_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-anahtar
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Mobil:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Aynı URL ve anon anahtarı `EXPO_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_ANON_KEY` olarak yazın. `EXPO_PUBLIC_SITE_URL` web sitesinin adresidir; Ayarlar ekranı randevu bağlantısını bununla paylaşır.

`.env`, `.env.local` ve mağaza anahtarları git’e girmez.

## 6. Web’i çalıştırın

```bash
pnpm --filter web dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000).

1. **Salon aç** ile e-posta, şifre ve salon adı verin.
2. Panele düşünce hizmet ve personel ekleyin. Personel kaydı açılınca haftalık saatler dolar; isterseniz öğle arası ve izin günü girin.
3. **Salon** sayfasındaki bağlantıyı kopyalayın. Adres `/s/salon-adi` biçimindedir.
4. Bu adresi gizli pencerede açıp bir randevu alın.
5. Panelde **Randevu** gününde kaydı görün. **Tamamlandı** veya **İptal et** deyin. İptal, saati yeniden açar.

Supabase bağlamadan arayüze bakmak için [http://localhost:3000/onizleme](http://localhost:3000/onizleme). Oradaki veriler örnektir, kaydolmaz.

## 7. Mobil uygulamayı yerelde açın

```bash
pnpm --filter mobile start
```

SDK 58 ile uyumlu Expo Go kuruluysa telefonla QR’ı okuyun. Sürüm uymuyorsa bir sonraki bölümdeki `preview` profiliyle APK veya simülatör derlemesi alın.

Uygulama salon sahibi içindir: giriş, bugünün listesi, personele göre boş saatler, randevu listesi, arama, tamamlama, iptal ve hesap silme. Hizmetler sekmesinde hizmet eklenir, düzenlenir, yayından kaldırılır veya silinir. Randevusu olan hizmet silinmez; istenirse yayından kalkar. Ayarlar ekranından salon adı, adres, telefon, tanıtım, harita, Instagram, çalışma özeti, logo ve kapak güncellenir. Logo telefonun fotoğraf arşivinden seçilir. Müşteri bu uygulamadan randevu almaz.

## 8. Test ve derleme

```bash
pnpm test
pnpm typecheck
pnpm --filter web build
```

`pnpm test` saat hesabını doğrular: 15 dakikalık ızgara, çalışma aralığı, öğle arası, izin günü, geçmiş saat, 60 gün sınırı ve çakışma. Aynı kurallar `book_appointment` içinde de vardır. Birini değiştirirseniz diğerini de güncelleyin.

Kurallar kısaca:

- Adım 15 dakika.
- Randevu, tek bir çalışma aralığının içine sığmalı.
- Aralıklar yarı açıktır: bitiş anı bir sonraki randevuya açık olur.
- İptal edilen kayıt yer kaplamaz.
- Şu andan 15 dakikadan yakını ve 60 günden sonrası kapalıdır.

## 9. Bildirimler (sonraki sürüm)

`notification_settings` satırı yokken hiçbir şey kuyruğa yazılmaz. Bir kanalı açmak için:

```sql
insert into public.notification_settings (salon_id, sms_enabled)
values ('SALON_UUID', true);
```

Bundan sonra yeni randevu ve iptal, `notification_outbox` tablosuna `pending` satır bırakır. Bu sürümde o satırları gönderen bir iş yoktur. Worker eklendiğinde `sms`, `whatsapp` ve `email` kanalları ile `booking_confirmed`, `booking_cancelled`, `reminder` şablonları kullanılabilir.

## 10. App Store ve Google Play

Uygulama kimliği yer tutucudur: iOS bundle `com.berberimrandevu.app`, Android package aynıdır. Mağazada bu kimlik başkasına aitse `apps/mobile/app.config.ts` içinde ikisini birden değiştirin. Kimlik bir kez yayınlandıktan sonra değişmez.

Sürüm `1.0.0`. iOS `buildNumber` ve Android `versionCode` başlangıç değeri `1`. Üretim profili bu numaraları EAS üzerinde artırır (`appVersionSource: remote`).

Simge, açılış görseli ve web favicon’u Berberimrandevu markasıyla hazırdır. iOS simgesi 1024×1024 ve saydam değildir. Android adaptive ikonun ön planı ve arka planı `apps/mobile/assets` altındadır.

### Expo hesabı

1. [expo.dev](https://expo.dev) üzerinde hesap açın.
2. `npm install -g eas-cli` ardından `eas login`.
3. `cd apps/mobile`
4. `eas init` deyip projeyi Expo’ya bağlayın. Çıkan proje kimliğini `EAS_PROJECT_ID` olarak `apps/mobile/.env` içine yazın. `app.config.ts` bu değeri okur. Yazmazsanız yer tutucu UUID ile derleme reddedilir.

### Ortam değişkenlerini EAS’e verin

Derleme makinesi sizin `.env` dosyanızı görmez. Üç ortamın her biri için:

```bash
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value https://PROJE_REF.supabase.co --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value ANON_ANAHTAR --environment production --visibility sensitive
eas env:create --name EXPO_PUBLIC_SITE_URL --value https://siteniz.com --environment production --visibility plaintext
```

Aynısını `--environment preview` ve `--environment development` ile de yapın. Anon anahtar gizlidir ama istemciye gömülür; asıl koruma veritabanı kurallarındadır. `service_role` anahtarını EAS’e de koymayın.

`eas.json` profilleri:

| Profil | Ne işe yarar |
| --- | --- |
| `development` | Geliştirme istemcisi. iOS simülatör derlemesi. |
| `preview` | İç dağıtım. Android’de APK, mağazaya gitmez. Ekibe denettirmek için. |
| `production` | Mağaza derlemesi. Android App Bundle (`.aab`). Sürüm numarası artar. |

Deneme APK:

```bash
eas build -p android --profile preview
```

### Apple App Store

1. [Apple Developer Program](https://developer.apple.com/programs/) üyeliği gerekir (yıllık ücretlidir).
2. App Store Connect’te yeni bir uygulama açın. Bundle ID, `com.berberimrandevu.app` olmalı. Bu kimliği Apple Developer → Identifiers altında da oluşturun.
3. Uygulama adı: **Berberimrandevu**. Birincil dil Türkçe olabilir.
4. Gizlilik politikası URL’si isteyecek. Web’de `/gizlilik` sayfasını yayınlayıp adresini yazın. Destek e-postası `NEXT_PUBLIC_CONTACT_EMAIL` değişkeninden gelir.
5. Hesap silme: uygulama içinde **Ayarlar → Hesabı ve salonu sil** vardır. Web panelinde de **Salon** sayfasındadır. İnceleme notuna bu yolu yazın.
6. Dışa aktarma uyumu: uygulama yalnızca HTTPS kullanır, `ITSAppUsesNonExemptEncryption` kapalıdır. Connect’te “özel şifreleme yok” deyin.
7. `apps/mobile/eas.json` içindeki `submit.production.ios` alanlarını doldurun:
   - `appleId`: Apple ID e-postanız
   - `ascAppId`: App Store Connect’teki uygulamanın sayısal kimliği (App Information → Apple ID)
   - `appleTeamId`: developer.apple.com üyelik sayfasındaki Team ID
8. Derleyin ve gönderin:

```bash
eas build -p ios --profile production
eas submit -p ios --profile production
```

İlk gönderimde EAS, dağıtım sertifikası ve profil oluşturmak için soru sorar. Apple hesabınızla giriş yapın.

Connect’te sürümü incelemeden önce: Türkçe ekran görüntüleri (6,7 inç iPhone), açıklama, yaş sınırı, destek URL’si ve inceleme için bir salon test hesabı. Müşteri tarafı web’dedir; inceleme notuna örnek randevu bağlantısını yazın.

### Google Play

1. [Google Play Console](https://play.google.com/console) hesabı açın (tek seferlik kayıt ücreti vardır).
2. Uygulama oluşturun. Paket adı `com.berberimrandevu.app` olmalı ve `app.config.ts` ile aynı kalmalı.
3. Play Console → **Setup → API access**. Bir Google Cloud hizmet hesabı oluşturup Play’e bağlayın. JSON anahtarını indirin ve `apps/mobile/google-play-service-account.json` olarak koyun. Bu dosya git’e girmez.
4. İç teste almak için `eas.json` Android gönderimi `internal` kanalındadır. Herkese açmadan önce bu kanalda deneyin. Herkese açacağınız zaman `track` değerini `production` yapın.
5. Derleyin ve gönderin:

```bash
eas build -p android --profile production
eas submit -p android --profile production
```

6. Play, veri güvenliği formunu ister. Bildirin:
   - Hesap: e-posta (salon sahibi)
   - Müşteri randevusu: ad ve telefon numarası
   - Veri silme: uygulama içinden hesap silme
   - Reklam ve satış takibi yok
7. Gizlilik politikası URL’si yine `/gizlilik` sayfanızdır.
8. Mağaza listesi Türkçe olmalı: kısa açıklama, tam açıklama ve telefon ekran görüntüleri.

İç testte sürüm göründükten sonra üretim kanalına yükseltmek Play Console’dan yapılır. `releaseStatus` şimdi `completed`; böylece iç test sürümü indirilebilir olur.

### Mağaza öncesi kontrol

- Simge ve açılış görseli sizin olsun.
- Bundle / package kimliği size ait olsun.
- `EAS_PROJECT_ID` gerçek olsun.
- Üretim Supabase adresleri EAS ortamına yazılmış olsun.
- Gizlilik sayfasındaki destek e-postası değişmiş olsun.
- Test salonu ile giriş, bugünün listesi, iptal ve hesap silme denenmiş olsun.

## Sık karşılaşılanlar

- **Salon kaydı yok:** SQL migrasyonu eksiktir veya e-posta onayı bekliyordur. Auth kullanıcısının `raw_user_meta_data` alanında `salon_name` durur; tetikleyici salonu ondan açar.
- **Randevu “çalışma saati dışında” diyor:** Personelin o günkü aralığı hizmet süresini kapsamıyordur veya gün izne yazılmıştır.
- **“Bu saat az önce doldu”:** İki kişi aynı slota bastı. Birisi kazanır, diğeri yeni saat seçer.
- **Bağlantı adı çakıştı:** Salon sayfasından başka bir slug yazın.
- **Personel silinemiyor:** Üzerinde randevu vardır. Pasife alın; eski kayıtlar durur.
