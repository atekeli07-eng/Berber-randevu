"use client";

import {
  formatTry,
  isValidDuration,
  parseTryToKurus,
  type Service,
} from "@berber/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { translateError } from "@/lib/errors";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button, Card, Field, Notice, inputClass } from "./ui";

export function ServicesManager({ salonId, services }: { salonId: string; services: Service[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("250");
  const [description, setDescription] = useState("");

  async function add(event: React.FormEvent) {
    event.preventDefault();
    const cleanName = name.trim().replace(/\s+/g, " ");
    const minutes = Number(duration);
    const kurus = parseTryToKurus(price);
    if (cleanName.length < 2) {
      setError("Hizmet adı en az 2 karakter olmalı.");
      return;
    }
    if (!isValidDuration(minutes)) {
      setError("Süre 5 ile 480 dakika arasında tam sayı olmalı.");
      return;
    }
    if (kurus === null) {
      setError("Fiyatı TL olarak girin. Örnek: 250 veya 250,50");
      return;
    }
    const supabase = createBrowserSupabase();
    const { error: insertError } = await supabase.from("services").insert({
      salon_id: salonId,
      name: cleanName,
      duration_minutes: minutes,
      price_kurus: kurus,
      description: description.trim() || null,
      sort_order: services.length,
    });
    if (insertError) {
      setError(translateError(insertError));
      return;
    }
    setName("");
    setDescription("");
    setError(null);
    router.refresh();
  }

  async function patch(id: string, values: Partial<Service>) {
    const supabase = createBrowserSupabase();
    const { error: updateError } = await supabase.from("services").update(values).eq("id", id);
    if (updateError) {
      setError(translateError(updateError));
      return;
    }
    setError(null);
    router.refresh();
  }

  async function remove(id: string) {
    const supabase = createBrowserSupabase();
    const { error: deleteError } = await supabase.from("services").delete().eq("id", id);
    if (deleteError) {
      setError(translateError(deleteError));
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl">Hizmetler</h1>
        <p className="text-sm text-muted">Süre müsait saatleri belirler. Fiyat kuruşa yuvarlanarak saklanır.</p>
      </div>
      {error ? <Notice>{error}</Notice> : null}
      <Card>
        <form onSubmit={add} className="grid gap-3 md:grid-cols-2">
          <Field label="Ad">
            <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Saç kesimi" />
          </Field>
          <Field label="Süre (dakika)">
            <input className={inputClass} value={duration} onChange={(event) => setDuration(event.target.value)} inputMode="numeric" />
          </Field>
          <Field label="Fiyat (TL)">
            <input className={inputClass} value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" />
          </Field>
          <Field label="Açıklama">
            <input className={inputClass} value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <Button type="submit">Hizmet ekle</Button>
          </div>
        </form>
      </Card>
      <div className="space-y-3">
        {services.length === 0 ? <p className="text-sm text-muted">Henüz hizmet yok.</p> : null}
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} onPatch={patch} onRemove={remove} />
        ))}
      </div>
    </div>
  );
}

function ServiceCard({
  service,
  onPatch,
  onRemove,
}: {
  service: Service;
  onPatch: (id: string, values: Partial<Service>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState(service.name);
  const [duration, setDuration] = useState(String(service.duration_minutes));
  const [price, setPrice] = useState((service.price_kurus / 100).toLocaleString("tr-TR"));
  const [description, setDescription] = useState(service.description ?? "");

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-serif text-2xl">{formatTry(service.price_kurus)}</p>
        <button type="button" className="text-sm font-semibold text-clay" onClick={() => onPatch(service.id, { active: !service.active })}>
          {service.active ? "Yayında" : "Gizli"}
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
        <input className={inputClass} value={duration} onChange={(event) => setDuration(event.target.value)} />
        <input className={inputClass} value={price} onChange={(event) => setPrice(event.target.value)} />
        <input className={inputClass} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Açıklama" />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => {
            const minutes = Number(duration);
            const kurus = parseTryToKurus(price);
            if (!isValidDuration(minutes) || kurus === null || name.trim().length < 2) return;
            void onPatch(service.id, {
              name: name.trim(),
              duration_minutes: minutes,
              price_kurus: kurus,
              description: description.trim() || null,
            });
          }}
        >
          Güncelle
        </Button>
        <Button type="button" variant="ghost" onClick={() => onRemove(service.id)}>
          Sil
        </Button>
      </div>
    </Card>
  );
}
