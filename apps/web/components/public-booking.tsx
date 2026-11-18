"use client";

import type { BookAppointmentResult } from "@berber/shared";
import { BookingWizard } from "@/components/booking-wizard";
import { issueBookingTicket } from "@/lib/issue-ticket";
import type { PublicCatalog } from "@/lib/catalog";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function PublicBooking({
  catalog,
  turnstileSiteKey = null,
}: {
  catalog: PublicCatalog;
  turnstileSiteKey?: string | null;
}) {
  return (
    <BookingWizard
      salon={catalog.salon}
      services={catalog.services}
      staff={catalog.staff}
      workingHours={catalog.workingHours}
      daysOff={catalog.daysOff}
      busy={catalog.busy}
      turnstileSiteKey={turnstileSiteKey}
      onBook={async (input): Promise<BookAppointmentResult> => {
        const ticketResult = await issueBookingTicket(input.captchaToken);
        if ("error" in ticketResult) throw new Error(ticketResult.error);
        const supabase = createBrowserSupabase();
        const { data, error } = await supabase.rpc("book_appointment", {
          p_salon_slug: catalog.salon.slug,
          p_staff_id: input.staffId,
          p_service_id: input.serviceId,
          p_starts_at: input.startsAt.toISOString(),
          p_customer_name: input.customerName,
          p_customer_phone: input.customerPhone,
          p_consent: input.consent,
          p_ticket: ticketResult.ticket,
        });
        if (error) throw new Error(error.message);
        const row = data as BookAppointmentResult | null;
        if (!row?.id) throw new Error("Randevu kaydı okunamadı");
        return row;
      }}
    />
  );
}
