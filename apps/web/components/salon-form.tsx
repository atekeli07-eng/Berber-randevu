"use client";

import { isValidSlug, slugify, type Salon } from "@berber/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { translateError } from "@/lib/errors";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { CopyLink } from "./copy-link";
import { Button, Card, Field, Notice, inputClass } from "./ui";

export function SalonForm({ salon }: { salon: Salon }) {
  const router = useRouter();
  const [name, setName] = useState(salon.name);
  const [slug, setSlug] = useState(salon.slug);
  const [phone, setPhone] = useState(salon.phone ?? "");
  const [city, setCity] = useState(salon.city ?? "");
  const [address, setAddress] = useState(salon.address ?? "");
  const [description, setDescription] = useState(salon.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const cleanName = name.trim().replace(/\s+/g, " ");
    const cleanSlug = slugify(slug);
    if (cleanName.length < 2) {
      setError("Salon adı çok kısa.");
      return;
    }
    if (!isValidSlug(cleanSlug)) {
      setError("Bağlantı adı yalnızca küçük harf, rakam ve tire içerebilir.");
      return;
    }
    setPending(true);
    setError(null);
    setInfo(null);
    const supabase = createBrowserSupabase();
    const { error: updateError } = await supabase
      .from("salons")
      .update({
        name: cleanName,
        slug: cleanSlug,
        phone: phone.trim() || null,
        city: city.trim() || null,
        address: address.trim() || null,
        description: description.trim() || null,
      })
      .eq("id", salon.id);
    setPending(false);
    if (updateError) {
      setError(translateError(updateError));
      return;
    }
    setSlug(cleanSlug);
    setInfo("Salon bilgileri kaydedildi.");
    router.refresh();
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
        <p className="text-sm text-muted">Müşterilerin göreceği bilgiler ve paylaşım bağlantısı.</p>
      </div>
      <Card>
        <h2 className="mb-3 font-serif text-2xl">Randevu bağlantısı</h2>
        <CopyLink path={`/s/${slug}`} />
      </Card>
      <Card>
        <form onSubmit={save} className="space-y-4">
          {error ? <Notice>{error}</Notice> : null}
          {info ? <Notice tone="good">{info}</Notice> : null}
          <Field label="Salon adı">
            <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Bağlantı adı" hint="Adresi değişince eski bağlantı çalışmaz.">
            <input className={inputClass} value={slug} onChange={(event) => setSlug(event.target.value)} />
          </Field>
          <Field label="Telefon">
            <input className={inputClass} value={phone} onChange={(event) => setPhone(event.target.value)} />
          </Field>
          <Field label="Şehir">
            <input className={inputClass} value={city} onChange={(event) => setCity(event.target.value)} />
          </Field>
          <Field label="Adres">
            <input className={inputClass} value={address} onChange={(event) => setAddress(event.target.value)} />
          </Field>
          <Field label="Kısa tanıtım">
            <textarea className={`${inputClass} h-28 py-3`} value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </form>
      </Card>
      <Card>
        <h2 className="font-serif text-2xl text-bad">Hesabı sil</h2>
        <p className="mt-2 text-sm text-muted">
          Salon, ekip, hizmetler ve randevular kalıcı olarak silinir. Uygulama mağazaları bu seçeneği hesap açan
          uygulamalarda ister.
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
