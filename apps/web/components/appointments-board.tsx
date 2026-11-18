"use client";

import {
  APPOINTMENT_STATUS_LABEL,
  addCalendarDays,
  calendarDateInZone,
  formatDayHeading,
  formatSlotTime,
  formatTurkishMobile,
  getAvailableSlots,
  normalizePersonName,
  normalizeTurkishMobile,
  toTelHref,
  type AppointmentStatus,
  type DayOff,
  type Salon,
  type Service,
  type Staff,
  type WorkingHour,
} from "@berber/shared";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AgendaItem } from "@/lib/agenda";
import { translateError } from "@/lib/errors";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { MonthCalendar } from "./month-calendar";
import { Button, Card, Field, Notice, cx, inputClass } from "./ui";

export function AppointmentsBoard({
  salon,
  staff,
  services,
  workingHours,
  daysOff,
  appointments,
  date,
  preview = false,
}: {
  salon: Salon;
  staff: Staff[];
  services: Service[];
  workingHours: WorkingHour[];
  daysOff: DayOff[];
  appointments: AgendaItem[];
  date: string;
  preview?: boolean;
}) {
  const router = useRouter();
  const [view, setView] = useState<"liste" | "gun">("gun");
  const [staffFilter, setStaffFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>("all");
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState(appointments);
  const [localDate, setLocalDate] = useState(date);
  const today = calendarDateInZone(new Date(), salon.timezone);
  const activeDate = preview ? localDate : date;

  useEffect(() => {
    setItems(appointments);
  }, [appointments, date]);

  const visible = (activeDate === date ? items : []).filter((item) => {
    if (staffFilter !== "all" && item.staffId !== staffFilter) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    return true;
  });

  function changeDate(next: string) {
    if (preview) {
      setLocalDate(next);
      return;
    }
    router.push(`/panel/randevular?tarih=${next}`);
  }

  async function setStatus(id: string, status: "done" | "cancelled") {
    if (preview) {
      setItems((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
      return;
    }
    const supabase = createBrowserSupabase();
    const { error: updateError } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (updateError) {
      setError(translateError(updateError));
      return;
    }
    setError(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl">Randevular</h1>
          <p className="text-sm text-muted">{formatDayHeading(activeDate, salon.timezone)}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant={view === "gun" ? "primary" : "ghost"} onClick={() => setView("gun")}>
            Gün
          </Button>
          <Button type="button" variant={view === "liste" ? "primary" : "ghost"} onClick={() => setView("liste")}>
            Liste
          </Button>
        </div>
      </div>

      {error ? <Notice>{error}</Notice> : null}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card>
          <div className="mb-3 flex justify-between text-sm">
            <button type="button" onClick={() => changeDate(addCalendarDays(date, -1))}>
              Önceki
            </button>
            <button type="button" className="font-semibold text-clay" onClick={() => changeDate(today)}>
              Bugün
            </button>
            <button type="button" onClick={() => changeDate(addCalendarDays(date, 1))}>
              Sonraki
            </button>
          </div>
          <MonthCalendar today={today} selected={activeDate} onSelect={changeDate} isAvailable={() => true} />
          <div className="mt-4 space-y-3">
            <Field label="Personel">
              <select className={inputClass} value={staffFilter} onChange={(event) => setStaffFilter(event.target.value)}>
                <option value="all">Tümü</option>
                {staff.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Durum">
              <select
                className={inputClass}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "all" | AppointmentStatus)}
              >
                <option value="all">Tümü</option>
                <option value="booked">Rezerve</option>
                <option value="done">Tamamlandı</option>
                <option value="cancelled">İptal</option>
              </select>
            </Field>
          </div>
        </Card>

        <div className="space-y-4">
          {view === "liste" ? (
            <div className="space-y-3">
              {visible.length === 0 ? <p className="text-sm text-muted">Bu süzgeçte randevu yok.</p> : null}
              {visible.map((item) => (
                <AppointmentCard key={item.id} item={item} timeZone={salon.timezone} onStatus={setStatus} />
              ))}
            </div>
          ) : (
            <DayTimeline items={visible.filter((item) => item.status !== "cancelled")} timeZone={salon.timezone} />
          )}
          <BlockTime
            salon={salon}
            staff={staff}
            workingHours={workingHours}
            daysOff={daysOff}
            appointments={items}
            date={activeDate}
            preview={preview}
            onCreated={(item) => setItems((current) => [...current, item].sort((a, b) => a.startsAt.localeCompare(b.startsAt)))}
          />
          <ManualBooking
            salon={salon}
            staff={staff}
            services={services}
            workingHours={workingHours}
            daysOff={daysOff}
            appointments={activeDate === date ? items : []}
            date={activeDate}
            preview={preview}
            onCreated={(item) => setItems((current) => [...current, item].sort((a, b) => a.startsAt.localeCompare(b.startsAt)))}
          />
        </div>
      </div>
    </div>
  );
}

function AppointmentCard({
  item,
  timeZone,
  onStatus,
}: {
  item: AgendaItem;
  timeZone: string;
  onStatus: (id: string, status: "done" | "cancelled") => void;
}) {
  return (
    <Card className={cx(item.status === "cancelled" && "opacity-60")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-serif text-2xl">{formatSlotTime(new Date(item.startsAt), timeZone)}</p>
          <p className="font-semibold">{item.customerName}</p>
          <p className="text-sm text-muted">
            {item.staffName} · {item.serviceName}
          </p>
          <a className="text-sm font-semibold text-clay" href={toTelHref(item.customerPhone)}>
            {formatTurkishMobile(item.customerPhone)}
          </a>
        </div>
        <span className="text-xs font-semibold tracking-wide text-gold">{APPOINTMENT_STATUS_LABEL[item.status]}</span>
      </div>
      {item.status === "booked" ? (
        <div className="mt-3 flex gap-2">
          <Button type="button" onClick={() => onStatus(item.id, "done")}>
            Tamamlandı
          </Button>
          <Button type="button" variant="ghost" onClick={() => onStatus(item.id, "cancelled")}>
            İptal et
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

function DayTimeline({ items, timeZone }: { items: AgendaItem[]; timeZone: string }) {
  const start = 8 * 60;
  const end = 21 * 60;
  const scale = 1.7;
  const height = (end - start) * scale;
  return (
    <Card className="overflow-hidden">
      <div className="relative" style={{ height }}>
        {Array.from({ length: (end - start) / 60 + 1 }, (_, index) => {
          const minute = start + index * 60;
          const top = (minute - start) * scale;
          return (
            <div key={minute} className="absolute right-0 left-14 border-t border-line" style={{ top }}>
              <span className="absolute -top-2 -left-14 w-12 text-xs text-muted">
                {String(Math.floor(minute / 60)).padStart(2, "0")}:00
              </span>
            </div>
          );
        })}
        {items.map((item) => {
          const startMinute = clockMinute(item.startsAt, timeZone);
          const endMinute = clockMinute(item.endsAt, timeZone);
          const top = (startMinute - start) * scale;
          const blockHeight = Math.max(44, (endMinute - startMinute) * scale);
          if (endMinute < start || startMinute > end) return null;
          return (
            <div
              key={item.id}
              className="absolute right-2 left-16 overflow-hidden rounded-2xl bg-bark px-3 py-1.5 text-card"
              style={{ top, height: blockHeight }}
            >
              <p className="truncate text-xs leading-4">
                {formatSlotTime(new Date(item.startsAt), timeZone)} · {item.staffName}
              </p>
              <p className="truncate text-sm leading-5 font-semibold">{item.customerName}</p>
              <p className="text-[11px] leading-4 text-card/70">{APPOINTMENT_STATUS_LABEL[item.status]}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function clockMinute(iso: string, timeZone: string): number {
  const label = formatSlotTime(new Date(iso), timeZone);
  const [hour, minute] = label.split(":").map(Number) as [number, number];
  return hour * 60 + minute;
}

function BlockTime({
  salon,
  staff,
  workingHours,
  daysOff,
  appointments,
  date,
  preview,
  onCreated,
}: {
  salon: Salon;
  staff: Staff[];
  workingHours: WorkingHour[];
  daysOff: DayOff[];
  appointments: AgendaItem[];
  date: string;
  preview: boolean;
  onCreated: (item: AgendaItem) => void;
}) {
  const activeStaff = staff.filter((person) => person.active);
  const [staffId, setStaffId] = useState(activeStaff[0]?.id ?? "");
  const [slot, setSlot] = useState("");
  const [duration, setDuration] = useState("30");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const minutes = Number(duration);
  const slots = useMemo(() => {
    const person = activeStaff.find((item) => item.id === staffId);
    if (!person || !Number.isInteger(minutes)) return [];
    return getAvailableSlots({
      date,
      timeZone: salon.timezone,
      durationMinutes: minutes,
      workingHours: workingHours
        .filter((row) => row.staff_id === person.id)
        .map((row) => ({ dayOfWeek: row.day_of_week, startMinute: row.start_minute, endMinute: row.end_minute })),
      dayOff: daysOff.some((row) => row.staff_id === person.id && row.off_date === date),
      busy: appointments
        .filter((item) => item.staffId === person.id && item.status !== "cancelled")
        .map((item) => ({ startsAt: new Date(item.startsAt), endsAt: new Date(item.endsAt) })),
    });
  }, [activeStaff, staffId, minutes, date, salon.timezone, workingHours, daysOff, appointments]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const person = activeStaff.find((item) => item.id === staffId);
    if (!person || !slot || !Number.isInteger(minutes) || minutes < 15 || minutes % 15 !== 0) {
      setError("Personel, saat ve 15 dakikanın katı bir süre seçin.");
      return;
    }
    if (preview) {
      onCreated({
        id: `blok-${slot}`,
        customerName: "Kapalı saat",
        customerPhone: "",
        startsAt: slot,
        endsAt: new Date(new Date(slot).getTime() + minutes * 60_000).toISOString(),
        status: "blocked",
        staffId: person.id,
        staffName: person.name,
        serviceId: "",
        serviceName: "Kapalı",
        notes: null,
      });
      return;
    }
    setPending(true);
    const { error: rpcError } = await createBrowserSupabase().rpc("create_blocked_time", {
      p_staff_id: person.id,
      p_starts_at: slot,
      p_duration_minutes: minutes,
    });
    setPending(false);
    if (rpcError) {
      setError(translateError(rpcError));
      return;
    }
    setError(null);
    router.refresh();
  }

  return (
    <details className="rounded-3xl border border-line bg-card p-5">
      <summary className="cursor-pointer font-serif text-2xl">Saat kapat</summary>
      <form onSubmit={submit} className="mt-4 space-y-3">
        {error ? <Notice>{error}</Notice> : null}
        <Field label="Personel">
          <select className={inputClass} value={staffId} onChange={(event) => setStaffId(event.target.value)}>
            {activeStaff.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Süre (dakika)">
          <input className={inputClass} value={duration} onChange={(event) => setDuration(event.target.value)} inputMode="numeric" />
        </Field>
        <Field label="Başlangıç">
          <select className={inputClass} value={slot} onChange={(event) => setSlot(event.target.value)}>
            <option value="">Saat seçin</option>
            {slots.map((item) => (
              <option key={item.startsAt.toISOString()} value={item.startsAt.toISOString()}>
                {formatSlotTime(item.startsAt, salon.timezone)}
              </option>
            ))}
          </select>
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? "Kapatılıyor…" : "Aralığı kapat"}
        </Button>
      </form>
    </details>
  );
}

function ManualBooking({
  salon,
  staff,
  services,
  workingHours,
  daysOff,
  appointments,
  date,
  preview,
  onCreated,
}: {
  salon: Salon;
  staff: Staff[];
  services: Service[];
  workingHours: WorkingHour[];
  daysOff: DayOff[];
  appointments: AgendaItem[];
  date: string;
  preview: boolean;
  onCreated: (item: AgendaItem) => void;
}) {
  const activeStaff = staff.filter((person) => person.active);
  const activeServices = services.filter((service) => service.active);
  const [staffId, setStaffId] = useState(activeStaff[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(activeServices[0]?.id ?? "");
  const [slot, setSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const slots = useMemo(() => {
    const person = activeStaff.find((item) => item.id === staffId);
    const service = activeServices.find((item) => item.id === serviceId);
    if (!person || !service) return [];
    return getAvailableSlots({
      date,
      timeZone: salon.timezone,
      durationMinutes: service.duration_minutes,
      workingHours: workingHours
        .filter((row) => row.staff_id === person.id)
        .map((row) => ({ dayOfWeek: row.day_of_week, startMinute: row.start_minute, endMinute: row.end_minute })),
      dayOff: daysOff.some((row) => row.staff_id === person.id && row.off_date === date),
      busy: appointments
        .filter((item) => item.staffId === person.id && item.status !== "cancelled")
        .map((item) => ({ startsAt: new Date(item.startsAt), endsAt: new Date(item.endsAt) })),
    });
  }, [activeStaff, activeServices, staffId, serviceId, date, salon.timezone, workingHours, daysOff, appointments]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const cleanName = normalizePersonName(name);
    const cleanPhone = normalizeTurkishMobile(phone);
    const service = activeServices.find((item) => item.id === serviceId);
    const person = activeStaff.find((item) => item.id === staffId);
    if (!cleanName || !slot || !service || !person || (phone.trim() && !cleanPhone)) {
      setError("Ad, hizmet ve saat gerekli. Telefon boş bırakılabilir veya 05xx biçiminde olmalıdır.");
      return;
    }
    if (preview) {
      onCreated({
        id: `onizleme-${slot}`,
        customerName: cleanName,
        customerPhone: cleanPhone ?? "",
        startsAt: slot,
        endsAt: new Date(new Date(slot).getTime() + service.duration_minutes * 60_000).toISOString(),
        status: "booked",
        staffId: person.id,
        staffName: person.name,
        serviceId: service.id,
        serviceName: service.name,
        notes: null,
      });
      setName("");
      setPhone("");
      setError(null);
      return;
    }
    setPending(true);
    const supabase = createBrowserSupabase();
    const { error: rpcError } = await supabase.rpc("create_manual_appointment", {
      p_staff_id: person.id,
      p_service_id: service.id,
      p_starts_at: slot,
      p_customer_name: cleanName,
      p_customer_phone: cleanPhone,
    });
    setPending(false);
    if (rpcError) {
      setError(translateError(rpcError));
      return;
    }
    setName("");
    setPhone("");
    setError(null);
    router.refresh();
  }

  return (
    <details className="rounded-3xl border border-line bg-card p-5">
      <summary className="cursor-pointer font-serif text-2xl">Telefon veya kapıdan randevu</summary>
      <form onSubmit={submit} className="mt-4 space-y-3">
        {error ? <Notice>{error}</Notice> : null}
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Personel">
            <select className={inputClass} value={staffId} onChange={(event) => setStaffId(event.target.value)}>
              {activeStaff.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Hizmet">
            <select className={inputClass} value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
              {activeServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Saat">
          <select className={inputClass} value={slot} onChange={(event) => setSlot(event.target.value)}>
            <option value="">Saat seçin</option>
            {slots.map((item) => (
              <option key={item.startsAt.toISOString()} value={item.startsAt.toISOString()}>
                {formatSlotTime(item.startsAt, salon.timezone)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Müşteri adı">
          <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Telefon" hint="Boş bırakılabilir.">
          <input className={inputClass} value={phone} onChange={(event) => setPhone(event.target.value)} />
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? "Ekleniyor…" : "Randevu oluştur"}
        </Button>
      </form>
    </details>
  );
}
