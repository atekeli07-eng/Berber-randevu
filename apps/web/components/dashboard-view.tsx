import { APPOINTMENT_STATUS_LABEL, formatSlotTime, type AppointmentStatus } from "@berber/shared";
import Link from "next/link";
import { CopyLink } from "./copy-link";
import { Card } from "./ui";

export type DashItem = {
  id: string;
  customerName: string;
  startsAt: string;
  status: AppointmentStatus;
  staffName: string;
  serviceName: string;
};

export function DashboardView({
  salonName,
  city,
  logoUrl,
  bookingPath,
  todayLabel,
  bookedToday,
  doneToday,
  staffCount,
  serviceCount,
  upcoming,
  timeZone,
}: {
  salonName: string;
  city: string | null;
  logoUrl?: string | null;
  bookingPath: string;
  todayLabel: string;
  bookedToday: number;
  doneToday: number;
  staffCount: number;
  serviceCount: number;
  upcoming: DashItem[];
  timeZone: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {logoUrl ? <img src={logoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : null}
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-gold">{todayLabel}</p>
          <h1 className="mt-1 font-serif text-4xl">{salonName}</h1>
          {city ? <p className="text-sm text-muted">{city}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Bugün bekleyen" value={bookedToday} />
        <Stat label="Bugün biten" value={doneToday} />
        <Stat label="Ekip" value={staffCount} />
        <Stat label="Hizmet" value={serviceCount} />
      </div>

      <Card>
        <h2 className="font-serif text-2xl">Müşteri bağlantısı</h2>
        <p className="mt-1 mb-4 text-sm text-muted">Hesap açmadan randevu alırlar. Bağlantıyı dilediğiniz yerde paylaşın.</p>
        <CopyLink path={bookingPath} />
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl">Sıradaki randevular</h2>
          <Link href="/panel/randevular" className="text-sm font-semibold text-clay">
            Günü aç
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">Bugün için bekleyen randevu yok.</p>
        ) : (
          <ul className="divide-y divide-line">
            {upcoming.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold">
                    {formatSlotTime(new Date(item.startsAt), timeZone)} · {item.customerName}
                  </p>
                  <p className="text-sm text-muted">
                    {item.staffName} · {item.serviceName}
                  </p>
                </div>
                <span className="text-xs font-semibold text-gold">{APPOINTMENT_STATUS_LABEL[item.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-line bg-card px-4 py-4">
      <p className="font-serif text-3xl">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
