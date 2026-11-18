"use client";

import { SalonForm } from "@/components/salon-form";
import { sampleSalon } from "@/lib/sample";

export default function PreviewSalonPage() {
  const sample = sampleSalon();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="mb-4 rounded-2xl bg-warn-soft px-3 py-2 text-sm text-gold">
        Örnek form. Kayıt ve görsel yükleme Supabase olmadan tamamlanmaz.
      </p>
      <SalonForm salon={sample.salon} />
    </main>
  );
}