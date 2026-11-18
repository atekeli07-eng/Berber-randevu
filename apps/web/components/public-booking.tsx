"use client";

import type { BookAppointmentResult } from "@berber/shared";
import { BookingWizard } from "@/components/booking-wizard";
import type { PublicCatalog } from "@/lib/catalog";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function PublicBooking({ catalog }: { catalog: PublicCatalog }) {
  return (
    <BookingWizard
      salon={catalog.salon}
      services={catalog.services}
      staff={catalog.staff}
      workingHours={catalog.workingHours}
      daysOff={catalog.daysOff}
      busy={catalog.busy}
      onBook={async (input): Promise<BookAppointmentResult> => {
        const supabase = createBrowserSupabase();
        const { data, error } = await supabase.rpc("book_appointment", {
          p_salon_slug: catalog.salon.slug,
          p_staff_id: input.staffId,
          p_service_id: input.serviceId,
          p_starts_at: input.startsAt.toISOString(),
          p_customer_name: input.customerName,
          p_customer_phone: input.customerPhone,
        });
        if (error) throw new Error(error.message);
        const row = data as BookAppointmentResult | null;
        if (!row?.id) throw new Error("Randevu kaydı okunamadı");
        return row;
      }}
    />
  );
}
