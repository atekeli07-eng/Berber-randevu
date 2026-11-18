"use client";

import { normalizePersonName, type Staff } from "@berber/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { translateError } from "@/lib/errors";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button, Card, Field, Notice, inputClass } from "./ui";

export function StaffManager({ salonId, staff }: { salonId: string; staff: Staff[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    const clean = normalizePersonName(name);
    if (!clean) {
      setError("Personel adı en az 2 harf olmalı.");
      return;
    }
    const supabase = createBrowserSupabase();
    const { data, error: insertError } = await supabase
      .from("staff")
      .insert({ salon_id: salonId, name: clean, title: title.trim() || null })
      .select("id")
      .single();
    if (insertError || !data) {
      setError(translateError(insertError ?? new Error("Eklenemedi")));
      return;
    }
    router.push(`/panel/personel/${data.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl">Ekip</h1>
        <p className="text-sm text-muted">Her berberin kendi takvimi ve çalışma saati vardır. Yeni kayıt pazartesi–cumartesi 09:00–19:00 ile açılır.</p>
      </div>
      {error ? <Notice>{error}</Notice> : null}
      <Card>
        <form onSubmit={add} className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <Field label="Ad">
            <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Ünvan">
            <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Usta" />
          </Field>
          <Button type="submit">Ekle</Button>
        </form>
      </Card>
      <div className="space-y-3">
        {staff.length === 0 ? <p className="text-sm text-muted">Henüz personel yok.</p> : null}
        {staff.map((person) => (
          <Link key={person.id} href={`/panel/personel/${person.id}`} className="block">
            <Card className="flex items-center justify-between">
              <span>
                <span className="block font-semibold">{person.name}</span>
                <span className="text-sm text-muted">{person.title || "Berber"}</span>
              </span>
              <span className="text-sm font-semibold text-clay">{person.active ? "Aktif" : "Pasif"}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
