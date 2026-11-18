import {
  addCalendarDays,
  calendarDateInZone,
  dayBounds,
  weekdayIndex,
  type DayOff,
  type Salon,
  type Service,
  type Staff,
  type WorkingHour,
} from "@berber/shared";
import type { AgendaItem } from "./agenda";
import type { BusyRow } from "@/components/booking-wizard";

const TZ = "Europe/Istanbul";

export function sampleSalon(now = new Date()): {
  salon: Salon;
  services: Service[];
  staff: Staff[];
  workingHours: WorkingHour[];
  daysOff: DayOff[];
  busy: BusyRow[];
  appointments: AgendaItem[];
  today: string;
} {
  const today = calendarDateInZone(now, TZ);
  const offDay = addCalendarDays(today, 2);
  const stamp = now.toISOString();
  const salon: Salon = {
    id: "salon-ornek",
    owner_id: "owner-ornek",
    name: "Sakal & Makas",
    slug: "sakal-makas",
    phone: "02122930000",
    address: "Turnacıbaşı Sokak 14",
    district: "Beyoğlu",
    city: "İstanbul",
    description: "Karaköy’de saç ve sakal. Randevulu çalışır.",
    maps_url: "https://maps.app.goo.gl/ornek",
    instagram: "sakalmakas",
    hours_summary: "Salı–cumartesi 10:00–20:00, pazar kapalı",
    logo_path: "/ornek-logo.png",
    cover_path: "/ornek-kapak.png",
    timezone: TZ,
    created_at: stamp,
    updated_at: stamp,
  };
  const services: Service[] = [
    service("svc-sac", "Saç kesimi", 30, 35000, 0, stamp),
    service("svc-sakal", "Sakal tıraşı", 20, 20000, 1, stamp),
    service("svc-ikisi", "Saç ve sakal", 50, 50000, 2, stamp),
  ];
  const staff: Staff[] = [
    person("st-emre", "Emre Usta", "Usta", stamp),
    person("st-kerem", "Kerem", "Kalfa", stamp),
  ];
  const workingHours: WorkingHour[] = [];
  for (const member of staff) {
    for (let day = 1; day <= 6; day += 1) {
      workingHours.push({
        id: `${member.id}-${day}-a`,
        staff_id: member.id,
        day_of_week: day,
        start_minute: 10 * 60,
        end_minute: 13 * 60,
      });
      workingHours.push({
        id: `${member.id}-${day}-b`,
        staff_id: member.id,
        day_of_week: day,
        start_minute: 14 * 60,
        end_minute: 20 * 60,
      });
    }
  }
  const daysOff: DayOff[] = [
    { id: "off-1", staff_id: "st-kerem", off_date: offDay, reason: "İzin" },
  ];
  const bounds = dayBounds(today, TZ);
  const at = (hour: number, minute = 0) => new Date(bounds.start.getTime() + (hour * 60 + minute) * 60_000);
  const appointments: AgendaItem[] = [
    item("a1", "Mert Aydın", "05321110001", at(10, 0), at(10, 30), "booked", staff[0]!, services[0]!),
    item("a2", "Deniz Kaya", "05332220002", at(11, 0), at(11, 50), "booked", staff[0]!, services[2]!),
    item("a3", "Can Öz", "05343330003", at(14, 0), at(14, 20), "done", staff[1]!, services[1]!),
    item("a4", "Ege Tan", "05354440004", at(16, 30), at(17, 0), "cancelled", staff[1]!, services[0]!),
  ];
  // Bugün çalışma günü değilse örnek randevuları yine gösteriyoruz; takvim hesabı haftanın gününe bakar.
  void weekdayIndex(today);
  const busy: BusyRow[] = appointments
    .filter((row) => row.status !== "cancelled")
    .map((row) => ({ staff_id: row.staffId, starts_at: row.startsAt, ends_at: row.endsAt }));
  return { salon, services, staff, workingHours, daysOff, busy, appointments, today };
}

function service(id: string, name: string, duration: number, price: number, order: number, stamp: string): Service {
  return {
    id,
    salon_id: "salon-ornek",
    name,
    duration_minutes: duration,
    price_kurus: price,
    description: null,
    active: true,
    sort_order: order,
    created_at: stamp,
    updated_at: stamp,
  };
}

function person(id: string, name: string, title: string, stamp: string): Staff {
  return {
    id,
    salon_id: "salon-ornek",
    name,
    title,
    active: true,
    created_at: stamp,
    updated_at: stamp,
  };
}

function item(
  id: string,
  customerName: string,
  phone: string,
  start: Date,
  end: Date,
  status: AgendaItem["status"],
  personRow: Staff,
  serviceRow: Service,
): AgendaItem {
  return {
    id,
    customerName,
    customerPhone: phone,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    status,
    staffId: personRow.id,
    staffName: personRow.name,
    serviceId: serviceRow.id,
    serviceName: serviceRow.name,
    notes: null,
  };
}
