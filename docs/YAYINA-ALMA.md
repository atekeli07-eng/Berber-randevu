# Yayına alma

Bu rehber, kod yazmadan Berberimrandevu’yu açmak içindir. Sırayı bozmayın. Her adımın sonunda neyi kaydettiğinizi not edin; sonraki adım onu sorar.

Bitince elinizde şunlar olur: bir veritabanı, bir web sitesi, App Store ve Google Play’e gidecek bir telefon uygulaması.

## 0. Hesaplar

Şunları açın. Ücretli olanlar: Apple (yıllık) ve Google Play (tek seferlik). Supabase’in ücretsiz planı bu sürüm için yeter. Vercel’in ücretsiz planı yeter. Expo’nun ücretsiz planı derleme kotası bitene kadar yeter.

1. [supabase.com](https://supabase.com) — e-posta ile hesap.
2. [vercel.com](https://vercel.com) — **Continue with GitHub** deyin. Aynı GitHub hesabı, bu deponun sahibi olsun.
3. [expo.dev](https://expo.dev) — hesap. Kullanıcı adınızı not edin.
4. [developer.apple.com](https://developer.apple.com) — Apple Developer Program. Onay birkaç gün sürebilir.
5. [play.google.com/console](https://play.google.com/console) — Google Play Console.

Bir alan adınız olsun. Örnek: `berberimrandevu.com`. Yoksa Vercel’in verdiği `birsey.vercel.app` adresiyle de açılır; mağaza gizlilik linki için kalıcı bir adres daha iyidir.

## 1. Supabase projesi

1. Supabase’te **New project**.
2. Ad: `berberimrandevu`. Bölge: Avrupa (Frankfurt yakın bir seçenek). İstanbul’a daha yakındır.
3. Veritabanı şifresini güçlü seçin ve bir yere yazın. Buna **veritabanı şifresi** diyeceğiz. `SUPABASE_DB_PASSWORD` budur.
4. Proje açılınca **Project Settings → General** ekranındaki **Reference ID** değerini kopyalayın. Buna **proje ref** diyeceğiz. `SUPABASE_PROJECT_REF` budur.
5. **Project Settings → API**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** anahtarı → `NEXT_PUBLIC_SUPABASE_ANON_KEY` ve `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` anahtarını kopyalamayın. Hiçbir yere yapıştırmayın.

### Veritabanını kurun

1. Solda **SQL Editor → New query**.
2. Bilgisayarınızdaki `supabase/setup.sql` dosyasını açın. Tamamını kopyalayıp sorgu kutusuna yapıştırın.
3. **Run**. Hata kırmızı yazıysa metni saklayın ve tekrar denemeden önce durun. “Success” görürseniz bu adım bitti.
4. Bu dosyayı bir daha çalıştırmayın. Tablolar zaten vardır; ikinci sefer “already exists” der.

`setup.sql`, üç kurulum dosyasını sırayla uygular ve GitHub’ın daha sonra aynı dosyaları yeniden çalıştırmasını engeller. İleride şema değişirse yeni dosyalar `supabase/migrations` içine konur; GitHub, `main` dalına her gönderimde onları yollar. Bunun için bölüm 4’teki üç sırrı eklemiş olmanız gerekir. Sırlar yoksa o adım sessizce atlanır, site bozulmaz.

### Giriş ayarı

**Authentication → Providers → Email** açık kalsın.

**Authentication → Sign In / Providers** altında e-posta onayı: müşteriye hemen panele düşürmek için başta kapatabilirsiniz. Mağaza incelemesi için açık tutmak daha doğrudur; inceleme notuna “e-posta onayı kapalı” yazmayın, test hesabını önceden onaylanmış oluşturun.

**Authentication → URL Configuration**

- **Site URL:** `https://ALANADINIZ` (sonda `/` yok)
- **Redirect URLs** listesine şunları ekleyin:
  - `https://ALANADINIZ/**`
  - Vercel’in verdiği adres varsa `https://BIRSEY.vercel.app/**`

Şifre en az 8 karakter. **Authentication → Policies** (veya Password) altında da 8 yapın.

## 2. Web sitesi (Vercel)

1. Vercel → **Add New → Project**.
2. GitHub’daki `Berber-randevu` deposunu seçin. İzin isterse **Authorize** deyin.
3. **Root Directory** alanını `apps/web` yapın. Edit deyip `apps/web` klasörünü seçin.
4. Framework **Next.js** kalsın. Node sürümü 22 olsun. `apps/web/.node-version` bunu söyler.
5. Build komutunu değiştirmeyin. `apps/web/vercel.json` önce ortak paketi, sonra siteyi derler.
6. **Environment Variables**. `apps/web/.env.example` dosyasındaki her satırı ekleyin. Yorum satırlarını (`#` ile başlayanlar) eklemeyin.

Zorunlu olanlar:

| Ad | Nereye |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public anahtar |
| `NEXT_PUBLIC_SITE_URL` | `https://ALANADINIZ` |
| `NEXT_PUBLIC_COMPANY_NAME` | Şirket unvanı. KVKK’da veri sorumlusu bu addır. |
| `NEXT_PUBLIC_COMPANY_ADDRESS` | Açık adres |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Destek e-postası. Mağazada da bu yazılır. |
| `NEXT_PUBLIC_KVKK_EMAIL` | KVKK başvuru adresi. Destekle aynıysa onu yazın. |

Turnstile (robot doğrulama) kullanmayacaksanız o üç alanı boş bırakın veya hiç eklemeyin. Kullanacaksanız üçünü birden doldurun ve aynı bilet sırrını Supabase SQL Editor’de çalıştırın:

```sql
insert into private.settings (key, value)
values ('booking_ticket_secret', 'AYNI_SIR')
on conflict (key) do update set value = excluded.value;
```

7. **Deploy**. Birkaç dakika sürer. Yeşil olunca `https://birsey.vercel.app` açılır.
8. Şirket bilgilerini sonradan değiştirirseniz Vercel’de değişkeni güncelleyip **Redeploy** deyin. Sayfalar derlenirken bu yazıları alır.

### Alan adı

1. Vercel proje → **Settings → Domains → Add**.
2. Alan adınızı yazın. Vercel, alan adı firmanızda girmeniz gereken kaydı gösterir. Onu aynen girin.
3. Adres açılınca Supabase Site URL ve Redirect URL’yi bu kalıcı adresle güncelleyin.
4. `NEXT_PUBLIC_SITE_URL` değerini de aynı adres yapıp yeniden deploy edin.

Kontrol: sitede **Salonu kaydet** ile bir hesap açın. Panele düşün. Hizmet ve bir berber ekleyin. Salon sayfasındaki bağlantıyı gizli pencerede açıp bir randevu alın. `/gizlilik`, `/kvkk` ve `/kosullar` sayfalarında şirket adınız görünsün. “Şirket bilgisi henüz yok” yazısı duruyorsa bir ortam değişkeni eksiktir.

## 3. Expo ve telefon uygulaması

1. [expo.dev](https://expo.dev) hesabınızla giriş yapın.
2. **Account settings → Access tokens → Create**. Ad: `github`. Çıkan anahtarı bir kez görürsünüz. `EXPO_TOKEN` budur.
3. Bilgisayarınızda, bu depoyu indirdiyseniz:

```bash
npm install -g eas-cli
eas login
cd apps/mobile
eas init
```

`eas init` bir proje kimliği verir. `EAS_PROJECT_ID` budur. Bilgisayarda komut çalıştırmak istemezseniz Expo sitesinde proje oluşturup **Project ID** değerini kopyalayın; `app.config.ts` bu kimliği okur.

## 4. GitHub sırları

Depo → **Settings → Secrets and variables → Actions → New repository secret**.

Her satır bir secret. Değerin adını birebir yazın.

| Secret | Ne |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | Supabase → Account → Access Tokens. Yoksa migrasyon adımı atlanır. |
| `SUPABASE_DB_PASSWORD` | Veritabanı şifresi |
| `SUPABASE_PROJECT_REF` | Reference ID |
| `EXPO_TOKEN` | Expo erişim anahtarı |
| `EAS_PROJECT_ID` | `eas init` kimliği |
| `EXPO_PUBLIC_SUPABASE_URL` | Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | anon anahtar |
| `EXPO_PUBLIC_SITE_URL` | `https://ALANADINIZ` |
| `APPLE_ID` | Apple hesabının e-postası |
| `ASC_APP_ID` | App Store Connect’te uygulamanın sayısal Apple ID’si |
| `APPLE_TEAM_ID` | developer.apple.com üyelik sayfasındaki Team ID |
| `EXPO_APPLE_APP_SPECIFIC_PASSWORD` | appleid.apple.com → Sign-In and Security → App-Specific Passwords. Normal Apple şifreniz değil. |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Play hizmet hesabının JSON dosyasının tamamı |

İlk derlemede Apple ve Play satırları boş kalabilir. O zaman GitHub’da **Actions → Mobil derleme → Run workflow** deyip **Mağazaya da gönder** kutusunu işaretlemeyin. Derleme Expo’da durur, mağazaya gitmez.

Supabase üçlüsü boşsa site yine çalışır. Yalnızca `main` dalındaki yeni veritabanı dosyaları otomatik uygulanmaz. İlk kurulum zaten `setup.sql` ile yapıldı.

## 5. App Store Connect

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Apps → New App**.
2. Platform: iOS. Ad: **Berberimrandevu**. Dil: Türkçe. Bundle ID: `com.berberimrandevu.app`. Bu kimliği önce developer.apple.com → Identifiers altında oluşturun. Bir kez yayınlanınca değişmez.
3. SKU: `berberimrandevu`.
4. **App Information** içindeki sayı **Apple ID**’dir. `ASC_APP_ID` budur.
5. Gizlilik politikası: `https://ALANADINIZ/gizlilik`
6. Kategori: Business.
7. Yaş sınırı sorularını `docs/store/tr.md` dosyasındaki tabloya göre yanıtlayın. Sonuç 4+.
8. Gizlilik etiketini aynı dosyadaki tabloya göre doldurun. Takip yok.
9. Ekran görüntüsü: 6,7 inç iPhone. Uygulamayı bir telefonda açıp Bugün, randevu, hizmetler ve ayarlar ekranlarının görüntüsünü alın.
10. Metinler `docs/store/tr.md` içindedir. İngilizce istiyorsanız `docs/store/en.md`.
11. Dışa aktarma: uygulama özel şifreleme kullanmaz. “None of the algorithms mentioned above” veya eşdeğeri.

### İnceleme notu ve deneme hesabı

Apple, uygulamaya girecek bir hesap ister. İncelemeden önce siteden bir salon açın. E-posta onayı açıksa o postayı onaylayın. İçine bir hizmet, bir berber ve bugüne bir randevu koyun. Şifreyi inceleme bitene kadar değiştirmeyin.

App Review Information:

- Kullanıcı adı: deneme salonunun e-postası
- Şifre: o hesabın şifresi
- Not (Türkçe veya İngilizce, ikisi de olur):

```
Bu uygulama salon sahibi panelidir. Müşteri hesap açmaz; randevuyu web sitesinden alır.

Deneme salonu yukarıdaki e-posta ve şifreyle açılır.
Herkese açık randevu sayfası: https://ALANADINIZ/s/DENEME-SLUG
Müşteri akışı uygulamada yoktur. Hizmet, berber, gün ve saat seçilip ad ve telefon bırakılır.

Hesap silme: Ayarlar → Hesabı ve salonu sil.
Uygulama SMS göndermez. Özel şifreleme yoktur, yalnızca HTTPS.
İletişim: DESTEK_EPOSTA
```

`DENEME-SLUG`, Salon sayfasındaki bağlantının son parçasıdır.

## 6. Google Play

1. Play Console → **Create app**. Ad: Berberimrandevu. Dil: Türkçe. Uygulama. Ücretsiz.
2. Paket adı, derleme yüklenince `com.berberimrandevu.app` olur. Bunu elle başka bir ad yapmayın.
3. **Policy → App content**: gizlilik URL’si `https://ALANADINIZ/gizlilik`. Veri güvenliği formunu `docs/store/tr.md` içindeki tabloya göre doldurun. Reklam yok. Hesap silme var.
4. **Setup → API access**. Google Cloud’da bir hizmet hesabı oluşturup Play’e davet edin. JSON anahtarını indirin. İçeriğinin tamamı `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` secret’ıdır. Bu dosyayı GitHub’a yüklemeyin.
5. İç test: en az bir test kullanıcısının Gmail’ini **Internal testing** listesine ekleyin. İlk gönderim bu kanala gider.

## 7. Derleme ve gönderme

1. GitHub deposu → **Actions → Mobil derleme → Run workflow**.
2. İlk seferde **Mağazaya da gönder** kapalı olsun. **Run**.
3. Yeşil olunca [expo.dev](https://expo.dev) projesinde iOS ve Android derlemesi görünür. Bitmesi yarım saat sürebilir. İş akışı, gönderme kapalıysa derlemenin bitmesini beklemez.
4. Apple ve Play secret’ları dolunca iş akışını yeniden çalıştırın. **Mağazaya da gönder** açık olsun. Play kanalı ilk sefer **internal** kalsın.
5. Sürüm etiketi de aynı işi yapar. `v1.0.0` gibi bir etiket `main` üzerine konursa derler ve iç teste gönderir.

Gönderme, `eas.json` içindeki yer tutucuları secret’larla değiştirir. O dosyadaki `degistirin@example.com` adresini elinizle düzeltmeniz gerekmez.

İç test çalışınca Play kanalını **production** seçip iş akışını bir kez daha çalıştırın. App Store’da sürümü **Add for Review** ile incelemeye verin.

## Sık takılma

- **Sayfada “Şirket bilgisi henüz yok”.** Vercel’de dört şirket değişkeninden biri boş. Doldurup Redeploy.
- **Kayıt olunca salon açılmıyor.** `setup.sql` çalışmamış veya e-posta onayı bekliyordur.
- **Randevu “çalışma saati dışında”.** Berberin o günü kapalıdır veya hizmet süresi aralığa sığmıyordur.
- **GitHub mobil işi kırmızı, EXPO_TOKEN.** Secret adı birebir `EXPO_TOKEN` değilse adım anahtarı görmez.
- **Play “package name” uyuşmuyor.** `com.berberimrandevu.app` dışında bir ad açılmış. Yeni uygulama açın; eski paket adı değişmez.
- **İkinci kez setup.sql.** Çalıştırmayın. Yeni değişiklikler GitHub Action ile gider.

## Kontrol listesi

- [ ] Supabase projesi açık, ref ve anon anahtar not edildi
- [ ] `supabase/setup.sql` SQL Editor’de bir kez çalıştı
- [ ] Site URL ve Redirect URLs alan adınızı gösteriyor
- [ ] E-posta ile bir salon açılıp panele girildi
- [ ] Vercel’de kök klasör `apps/web`
- [ ] Yedi zorunlu web değişkeni dolu, `service_role` yok
- [ ] `/gizlilik`, `/kvkk`, `/kosullar` şirket adınızı gösteriyor
- [ ] Alan adı açılıyor ve `NEXT_PUBLIC_SITE_URL` o adres
- [ ] Gizli pencerede bir randevu alındı
- [ ] Expo hesabı, `EXPO_TOKEN` ve `EAS_PROJECT_ID` var
- [ ] GitHub secret listesindeki Supabase ve Expo satırları dolu
- [ ] Mobil derleme Expo’da bitti
- [ ] App Store uygulaması `com.berberimrandevu.app`, deneme hesabı ve inceleme notu yazılı
- [ ] Play iç testinde paket adı aynı, veri güvenliği formu dolu
- [ ] Apple ve Play secret’ları dolunca “Mağazaya da gönder” çalıştı
- [ ] Hesabı sil (Ayarlar) bir deneme salonunda görüldü
