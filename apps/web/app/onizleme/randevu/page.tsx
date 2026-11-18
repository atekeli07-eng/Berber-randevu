"use client";

import type { BookAppointmentResult } from "@berber/shared";
import { resolveSalonImage } from "@berber/shared";
import { BookingWizard } from "@/components/booking-wizard";
import { SalonBanner } from "@/components/salon-banner";
import { sampleSalon } from "@/lib/sample";

export default function PreviewBookingPage() {
  const sample = sampleSalon();
  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <p className="mb-4 rounded-2xl bg-warn-soft px-3 py-2 text-sm text-gold">
        Örnek veri. Randevu bir salona kaydedilmez.
      </p>
      <SalonBanner
        salon={sample.salon}
        logoUrl={resolveSalonImage(undefined, sample.salon.logo_path)}
        coverUrl={resolveSalonImage(undefined, sample.salon.cover_path)}
      />
      <BookingWizard
        {...sample}
        preview
        onBook={async (input): Promise<BookAppointmentResult> => {
          const service = sample.services.find((item) => item.id === input.serviceId);
          const person = sample.staff.find((item) => item.id === input.staffId);
          return {
            id: "onizleme",
            starts_at: input.startsAt.toISOString(),
            ends_at: new Date(input.startsAt.getTime() + (service?.duration_minutes ?? 30) * 60_000).toISOString(),
            customer_name: input.customerName,
            service_name: service?.name ?? "Hizmet",
            staff_name: person?.name ?? "Berber",
            salon_name: sample.salon.name,
            manage_token: "ornek-yonetim-baglantisi",
          };
        }}
      />
    </main>
  );
}
