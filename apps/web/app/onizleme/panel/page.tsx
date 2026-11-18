"use client";

import { AppointmentsBoard } from "@/components/appointments-board";
import { DashboardView } from "@/components/dashboard-view";
import { formatDayHeading, formatSalonAddress, resolveSalonImage } from "@berber/shared";
import { sampleSalon } from "@/lib/sample";

export default function PreviewPanelPage() {
  const sample = sampleSalon();
  const booked = sample.appointments.filter((item) => item.status === "booked");
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-6">
      <p className="rounded-2xl bg-warn-soft px-3 py-2 text-sm text-gold">
        Örnek veri. Düğmeler salona yazmaz; gün görünümünü ve akışı göstermek içindir.
      </p>
      <DashboardView
        salonName={sample.salon.name}
        city={formatSalonAddress(sample.salon)}
        logoUrl={resolveSalonImage(undefined, sample.salon.logo_path)}
        bookingPath="/onizleme/randevu"
        todayLabel={formatDayHeading(sample.today, sample.salon.timezone)}
        bookedToday={booked.length}
        doneToday={sample.appointments.filter((item) => item.status === "done").length}
        staffCount={sample.staff.length}
        serviceCount={sample.services.length}
        upcoming={booked.map((item) => ({
          id: item.id,
          customerName: item.customerName,
          startsAt: item.startsAt,
          status: item.status,
          staffName: item.staffName,
          serviceName: item.serviceName,
        }))}
        timeZone={sample.salon.timezone}
      />
      <AppointmentsBoard
        salon={sample.salon}
        staff={sample.staff}
        services={sample.services}
        workingHours={sample.workingHours}
        daysOff={sample.daysOff}
        appointments={sample.appointments}
        date={sample.today}
        preview
      />
    </main>
  );
}
