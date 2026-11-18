"use client";

import {
  SALON_COVER_MAX_EDGE,
  SALON_LOGO_MAX_EDGE,
  isValidSlug,
  parseSalonProfile,
  resolveSalonImage,
  salonMediaObjectPath,
  slugify,
  type Salon,
} from "@berber/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { translateError } from "@/lib/errors";
import { resizeSalonImage } from "@/lib/image";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { CopyLink } from "./copy-link";
import { Button, Card, Field, Notice, inputClass } from "./ui";

export function SalonForm({ salon }: { salon: Salon }) {
  const router = useRouter();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const [name, setName] = useState(salon.name);
  const [slug, setSlug] = useState(salon.slug);
  const [phone, setPhone] = useState(salon.phone ?? "");
  const [address, setAddress] = useState(salon.address ?? "");
  const [district, setDistrict] = useState(salon.district ?? "");
  const [city, setCity] = useState(salon.city ?? "");
  const [description, setDescription] = useState(salon.description ?? "");
  const [mapsUrl, setMapsUrl] = useState(salon.maps_url ?? "");
  const [instagram, setInstagram] = useState(salon.instagram ?? "");
  const [hoursSummary, setHoursSummary] = useState(salon.hours_summary ?? "");
  const [maxActive, setMaxActive] = useState(String(salon.max_active_bookings ?? 3));
  const [maxDaily, setMaxDaily] = useState(String(salon.max_daily_bookings ?? 1));
  const [cutoff, setCutoff] = useState(String(salon.cancellation_cutoff_hours ?? 3));
  const [logoPath, setLogoPath] = useState(salon.logo_path);
  const [coverPath, setCoverPath] = useState(salon.cover_path);
  const [version, setVersion] = useState(salon.updated_at);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const logoUrl = resolveSalonImage(supabaseUrl, logoPath, version);
  const coverUrl = resolveSalonImage(supabaseUrl, coverPath, version);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parseSalonProfile({
      name,
      address,
      district,
      city,
      phone,
      description,
      mapsUrl,
      instagram,
      hoursSummary,
    });
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    const cleanSlug = slugify(slug);
    if (!isValidSlug(cleanSlug)) {
      setError("Bağlantı adı yalnızca küçük harf, rakam ve tire içerebilir.");
      return;
    }
    const activeLimit = Number(maxActive);
    const dailyLimit = Number(maxDaily);
    const cutoffHours = Number(cutoff);
    if (!Number.isInteger(activeLimit) || activeLimit < 1 || activeLimit > 10) {
      setError("Aktif randevu sınırı 1 ile 10 arasında olmalı.");
      return;
    }
    if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 5) {
      setError("Günlük randevu sınırı 1 ile 5 arasında olmalı.");
      return;
    }
    if (!Number.isInteger(cutoffHours) || cutoffHours < 0 || cutoffHours > 72) {
      setError("İptal sınırı 0 ile 72 saat arasında olmalı.");
      return;
    }
    setPending(true);
    setError(null);
    setInfo(null);
    const supabase = createBrowserSupabase();
    const { error: updateError } = await supabase
      .from("salons")
      .update({
        ...parsed.value,
        slug: cleanSlug,
        max_active_bookings: activeLimit,
        max_daily_bookings: dailyLimit,
        cancellation_cutoff_hours: cutoffHours,
      })
      .eq("id", salon.id);
    setPending(false);
    if (updateError) {
      setError(translateError(updateError));
      return;
    }
    setSlug(cleanSlug);
    setName(parsed.value.name);
    setInfo("Salon bilgileri kaydedildi.");
    router.refresh();
  }

  async function upload(kind: "logo" | "cover", file: File | undefined) {
    if (!file) return;
    setUploading(kind);
    setError(null);
    setInfo(null);
    try {
      const blob = await resizeSalonImage(file, kind === "logo" ? SALON_LOGO_MAX_EDGE : SALON_COVER_MAX_EDGE);
      const extension = blob.type === "image/webp" ? "webp" : "jpg";
      const path = salonMediaObjectPath(salon.id, kind, extension);
      const previous = kind === "logo" ? logoPath : coverPath;
      const supabase = createBrowserSupabase();
      const { error: uploadError } = await supabase.storage.from("salon-media").upload(path, blob, {
        upsert: true,
        contentType: blob.type,
        cacheControl: "3600",
      });
      if (uploadError) throw uploadError;
      if (previous && previous !== path && !previous.startsWith("/") && !previous.startsWith("http")) {
        await supabase.storage.from("salon-media").remove([previous]);
      }
      const column = kind === "logo" ? "logo_path" : "cover_path";
      const { error: updateError } = await supabase.from("salons").update({ [column]: path }).eq("id", salon.id);
      if (updateError) throw updateError;
      if (kind === "logo") setLogoPath(path);
      else setCoverPath(path);
      setVersion(new Date().toISOString());
      setInfo(kind === "logo" ? "Logo güncellendi." : "Kapak görseli güncellendi.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? translateError(caught) : "Görsel yüklenemedi.");
    } finally {
      setUploading(null);
    }
  }

  async function clearImage(kind: "logo" | "cover") {
    const previous = kind === "logo" ? logoPath : coverPath;
    if (!previous) return;
    setUploading(kind);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      if (!previous.startsWith("/") && !previous.startsWith("http")) {
        await supabase.storage.from("salon-media").remove([previous]);
      }
      const column = kind === "logo" ? "logo_path" : "cover_path";
      const { error: updateError } = await supabase.from("salons").update({ [column]: null }).eq("id", salon.id);
      if (updateError) throw updateError;
      if (kind === "logo") setLogoPath(null);
      else setCoverPath(null);
      setInfo(kind === "logo" ? "Logo kaldırıldı." : "Kapak görseli kaldırıldı.");
      router.refresh();
    } catch (caught) {
      setError(translateError(caught));
    } finally {
      setUploading(null);
    }
  }

  async function removeAccount() {
    if (confirm.trim() !== salon.name) {
      setError("Silmek için salon adını aynen yazın.");
      return;
    }
    setDeleting(true);
    setError(null);
    const supabase = createBrowserSupabase();
    const { error: deleteError } = await supabase.rpc("delete_owner_account");
    if (deleteError) {
      setDeleting(false);
      setError(translateError(deleteError));
      return;
    }
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl">Salon</h1>
        <p className="text-sm text-muted">Müşterilerin randevu sayfasında göreceği kimlik ve iletişim.</p>
      </div>
      <Card>
        <h2 className="mb-3 font-serif text-2xl">Randevu bağlantısı</h2>
        <CopyLink path={`/s/${slug}`} />
      </Card>
      <Card className="space-y-4">
        <h2 className="font-serif text-2xl">Görseller</h2>
        <p className="text-sm text-muted">JPG, PNG veya WebP. Logo 512, kapak 1600 piksele küçültülür. En fazla 2 MB.</p>
        {error ? <Notice>{error}</Notice> : null}
        {info ? <Notice tone="good">{info}</Notice> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <ImageSlot
            label="Logo"
            url={logoUrl}
            busy={uploading === "logo"}
            onFile={(file) => upload("logo", file)}
            onClear={() => clearImage("logo")}
          />
          <ImageSlot
            label="Kapak"
            url={coverUrl}
            wide
            busy={uploading === "cover"}
            onFile={(file) => upload("cover", file)}
            onClear={() => clearImage("cover")}
          />
        </div>
      </Card>
      <Card>
        <form onSubmit={save} className="space-y-4">
          <Field label="Salon adı">
            <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Bağlantı adı" hint="Adresi değişince eski bağlantı çalışmaz.">
            <input className={inputClass} value={slug} onChange={(event) => setSlug(event.target.value)} />
          </Field>
          <Field label="Telefon" hint="Cep veya sabit hat. Örnek: 0212 293 00 00">
            <input className={inputClass} value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" />
          </Field>
          <Field label="Sokak ve kapı no">
            <input className={inputClass} value={address} onChange={(event) => setAddress(event.target.value)} />
          </Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="İlçe">
              <input className={inputClass} value={district} onChange={(event) => setDistrict(event.target.value)} />
            </Field>
            <Field label="Şehir">
              <input className={inputClass} value={city} onChange={(event) => setCity(event.target.value)} />
            </Field>
          </div>
          <Field label="Kısa tanıtım">
            <textarea className={`${inputClass} h-28 py-3`} value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>
          <Field label="Çalışma saati özeti" hint="Müşteriye görünen not. Personelin kendi takvimi ayrıdır.">
            <input className={inputClass} value={hoursSummary} onChange={(event) => setHoursSummary(event.target.value)} placeholder="Salı–cumartesi 10:00–20:00" />
          </Field>
          <Field label="Google Maps bağlantısı">
            <input className={inputClass} value={mapsUrl} onChange={(event) => setMapsUrl(event.target.value)} placeholder="https://maps.app.goo.gl/..." />
          </Field>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Aktif randevu sınırı" hint="Aynı telefonda, ileri tarih.">
              <input className={inputClass} value={maxActive} onChange={(event) => setMaxActive(event.target.value)} inputMode="numeric" />
            </Field>
            <Field label="Günlük sınır" hint="Aynı gün ve telefon.">
              <input className={inputClass} value={maxDaily} onChange={(event) => setMaxDaily(event.target.value)} inputMode="numeric" />
            </Field>
            <Field label="İptal sınırı (saat)">
              <input className={inputClass} value={cutoff} onChange={(event) => setCutoff(event.target.value)} inputMode="numeric" />
            </Field>
          </div>
          <Field label="Instagram">
            <input className={inputClass} value={instagram} onChange={(event) => setInstagram(event.target.value)} placeholder="@salon" />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </form>
      </Card>
      <Card>
        <h2 className="font-serif text-2xl text-bad">Hesabı sil</h2>
        <p className="mt-2 text-sm text-muted">
          Salon, ekip, hizmetler, görseller ve randevular kalıcı olarak silinir. Uygulama mağazaları bu seçeneği hesap
          açan uygulamalarda ister.
        </p>
        <div className="mt-4 space-y-3">
          <Field label={`Onay için “${salon.name}” yazın`}>
            <input className={inputClass} value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          </Field>
          <Button type="button" variant="danger" disabled={deleting} onClick={removeAccount}>
            {deleting ? "Siliniyor…" : "Hesabı ve salonu sil"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ImageSlot({
  label,
  url,
  wide,
  busy,
  onFile,
  onClear,
}: {
  label: string;
  url: string | null;
  wide?: boolean;
  busy: boolean;
  onFile: (file: File | undefined) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      {url ? (
        <img src={url} alt="" className={wide ? "mb-3 h-28 w-full rounded-2xl object-cover" : "mb-3 h-24 w-24 rounded-2xl object-cover"} />
      ) : (
        <div className={`mb-3 rounded-2xl border border-dashed border-line bg-paper ${wide ? "h-28" : "h-24 w-24"}`} />
      )}
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex h-11 cursor-pointer items-center rounded-full border border-line bg-card px-4 text-sm font-semibold">
          {busy ? "Yükleniyor…" : "Görsel seç"}
          <input
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(event) => {
              onFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
        {url ? (
          <button type="button" className="text-sm font-semibold text-bad" onClick={onClear} disabled={busy}>
            Kaldır
          </button>
        ) : null}
      </div>
    </div>
  );
}
