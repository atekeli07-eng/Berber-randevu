"use client";

import {
  MAX_DAYS_AHEAD,
  addCalendarDays,
  calendarDateInZone,
  formatLongDate,
  formatSlotTime,
  formatTry,
  formatTurkishMobile,
  getAvailableSlots,
  normalizePersonName,
  normalizeTurkishMobile,
  type BookAppointmentResult,
  type BusyRange,
  type DayOff,
  type Salon,
  type Service,
  type Staff,
  type WorkingHour,
} from "@berber/shared";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { translateError } from "@/lib/errors";
import { MonthCalendar } from "./month-calendar";
import { Button, Card, Field, Notice, cx, inputClass } from "./ui";

export type BusyRow = { staff_id: string; starts_at: string; ends_at: string };

const STEPS = ["Hizmet", "Berber", "Tarih", "Saat", "Bilgiler"];

export function BookingWizard({
  salon,
  services,
  staff,
  workingHours,
  daysOff,
  busy,
  onBook,
  preview = false,
  turnstileSiteKey = null,
}: {
  salon: Salon;
  services: Service[];
  staff: Staff[];
  workingHours: WorkingHour[];
  daysOff: DayOff[];
  busy: BusyRow[];
  onBook: (input: {
    staffId: string;
    serviceId: string;
    startsAt: Date;
    customerName: string;
    customerPhone: string;
    consent: boolean;
    captchaToken: string | null;
  }) => Promise<BookAppointmentResult>;
  preview?: boolean;
  turnstileSiteKey?: string | null;
}) {
  const [now] = useState(() => new Date());
  const today = calendarDateInZone(now, salon.timezone);
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<string | null>(services[0]?.id ?? null);
  const [staffId, setStaffId] = useState<string | null>(staff[0]?.id ?? null);
  const [date, setDate] = useState<string | null>(null);
  const [slotIso, setSlotIso] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<BookAppointmentResult | null>(null);

  const service = services.find((item) => item.id === serviceId) ?? null;
  const barber = staff.find((item) => item.id === staffId) ?? null;

  const slots = useMemo(() => {
    if (!service || !barber || !date) return [];
    const busyRanges: BusyRange[] = busy
      .filter((row) => row.staff_id === barber.id)
      .map((row) => ({ startsAt: new Date(row.starts_at), endsAt: new Date(row.ends_at) }));
    return getAvailableSlots({
      date,
      timeZone: salon.timezone,
      durationMinutes: service.duration_minutes,
      workingHours: workingHours
        .filter((row) => row.staff_id === barber.id)
        .map((row) => ({
          dayOfWeek: row.day_of_week,
          startMinute: row.start_minute,
          endMinute: row.end_minute,
        })),
      dayOff: daysOff.some((row) => row.staff_id === barber.id && row.off_date === date),
      busy: busyRanges,
      now,
    });
  }, [service, barber, date, busy, workingHours, daysOff, salon.timezone, now]);

  function dayOpen(day: string): boolean {
    if (!service || !barber) return false;
    if (day < today || day > addCalendarDays(today, MAX_DAYS_AHEAD)) return false;
    return (
      getAvailableSlots({
        date: day,
        timeZone: salon.timezone,
        durationMinutes: service.duration_minutes,
        workingHours: workingHours
          .filter((row) => row.staff_id === barber.id)
          .map((row) => ({
            dayOfWeek: row.day_of_week,
            startMinute: row.start_minute,
            endMinute: row.end_minute,
          })),
        dayOff: daysOff.some((row) => row.staff_id === barber.id && row.off_date === day),
        busy: busy
          .filter((row) => row.staff_id === barber.id)
          .map((row) => ({ startsAt: new Date(row.starts_at), endsAt: new Date(row.ends_at) })),
        now,
      }).length > 0
    );
  }

  async function submit() {
    if (!service || !barber || !slotIso) return;
    const cleanName = normalizePersonName(name);
    const cleanPhone = normalizeTurkishMobile(phone);
    if (!cleanName) {
      setError("Ad soyad en az 2 harf olmalı.");
      return;
    }
    if (!cleanPhone) {
      setError("Cep telefonunu 05xx xxx xx xx biçiminde girin.");
      return;
    }
    if (!consent) {
      setError("Devam etmek için aydınlatma metnini onaylayın.");
      return;
    }
    if (turnstileSiteKey && !captchaToken) {
      setError("Doğrulama kutusunu işaretleyin.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const booked = await onBook({
        staffId: barber.id,
        serviceId: service.id,
        startsAt: new Date(slotIso),
        customerName: cleanName,
        customerPhone: cleanPhone,
        consent,
        captchaToken,
      });
      setResult(booked);
    } catch (caught) {
      setError(translateError(caught));
    } finally {
      setPending(false);
    }
  }

  if (services.length === 0 || staff.length === 0) {
    return (
      <Card>
        <h1 className="font-serif text-3xl">{salon.name}</h1>
        <p className="mt-3 text-muted">Bu salon henüz randevu açmıyor. Biraz sonra tekrar bakın.</p>
      </Card>
    );
  }

  if (result) {
    return (
      <Card>
        <p className="text-xs font-semibold tracking-[0.18em] text-gold">RANDEVU ALINDI</p>
        <h1 className="mt-2 font-serif text-4xl">Sizi bekliyoruz.</h1>
        <dl className="mt-6 space-y-3 text-sm">
          <Row label="Salon" value={result.salon_name} />
          <Row label="Hizmet" value={result.service_name} />
          <Row label="Berber" value={result.staff_name} />
          <Row label="Zaman" value={formatLongDate(new Date(result.starts_at), salon.timezone)} />
          <Row label="Saat" value={formatSlotTime(new Date(result.starts_at), salon.timezone)} />
          <Row label="Ad" value={result.customer_name} />
        </dl>
        {result.manage_token ? (
          <p className="mt-6 text-sm">
            <Link className="font-semibold text-clay" href={preview ? "/onizleme/iptal" : `/r/${result.manage_token}`}>
              Randevuyu görüntüle veya iptal et
            </Link>
          </p>
        ) : null}
        <p className="mt-3 text-sm text-muted">
          Bu bağlantıyı saklayın. SMS gönderilmez.
          {preview ? " Örnek kayıttır, salona iletilmedi." : ""}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-gold">
          ADIM {step + 1} / {STEPS.length}
        </p>
        <h1 className="mt-1 font-serif text-4xl">{STEPS[step]}</h1>
        <p className="mt-1 text-sm text-muted">{salon.name}</p>
      </div>
      <ol className="grid grid-cols-5 gap-1">
        {STEPS.map((label, index) => (
          <li key={label} className={cx("h-1.5 rounded-full", index <= step ? "bg-clay" : "bg-line")} />
        ))}
      </ol>

      {step === 0 ? (
        <div className="space-y-2">
          {services.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setServiceId(item.id);
                setSlotIso(null);
              }}
              className={cx(
                "flex w-full items-center justify-between rounded-3xl border px-4 py-4 text-left",
                item.id === serviceId ? "border-clay bg-card" : "border-line bg-card/60",
              )}
            >
              <span>
                <span className="block font-semibold">{item.name}</span>
                <span className="text-sm text-muted">{item.duration_minutes} dk</span>
              </span>
              <span className="font-serif text-xl">{formatTry(item.price_kurus)}</span>
            </button>
          ))}
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-2">
          {staff.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setStaffId(item.id);
                setDate(null);
                setSlotIso(null);
              }}
              className={cx(
                "flex w-full items-center gap-3 rounded-3xl border px-4 py-4 text-left",
                item.id === staffId ? "border-clay bg-card" : "border-line bg-card/60",
              )}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-bark font-serif text-lg text-card">
                {item.name.slice(0, 1)}
              </span>
              <span>
                <span className="block font-semibold">{item.name}</span>
                <span className="text-sm text-muted">{item.title || "Berber"}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <Card>
          <MonthCalendar
            today={today}
            selected={date}
            isAvailable={dayOpen}
            onSelect={(next) => {
              setDate(next);
              setSlotIso(null);
            }}
          />
          <p className="mt-3 text-xs text-muted">En fazla {MAX_DAYS_AHEAD} gün sonrasına kadar. Dolu ve izinli günler kapalıdır.</p>
        </Card>
      ) : null}

      {step === 3 ? (
        <div>
          {slots.length === 0 ? (
            <Notice>Bu gün için müsait saat kalmadı. Başka bir gün seçin.</Notice>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => {
                const iso = slot.startsAt.toISOString();
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSlotIso(iso)}
                    className={cx(
                      "h-12 rounded-2xl border text-sm font-semibold",
                      slotIso === iso ? "border-clay bg-clay text-card" : "border-line bg-card",
                    )}
                  >
                    {formatSlotTime(slot.startsAt, salon.timezone)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {step === 4 && service && barber && slotIso ? (
        <Card className="space-y-4">
          <dl className="space-y-2 text-sm">
            <Row label="Hizmet" value={`${service.name} · ${service.duration_minutes} dk · ${formatTry(service.price_kurus)}`} />
            <Row label="Berber" value={barber.name} />
            <Row
              label="Zaman"
              value={`${formatLongDate(new Date(slotIso), salon.timezone)} · ${formatSlotTime(new Date(slotIso), salon.timezone)}`}
            />
          </dl>
          <Field label="Ad soyad">
            <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
          </Field>
          <Field label="Cep telefonu" hint="Hesap açılmaz. Numara yalnızca salon içindir.">
            <input
              className={inputClass}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="tel"
              autoComplete="tel"
              placeholder="05xx xxx xx xx"
            />
          </Field>
          {phone && normalizeTurkishMobile(phone) ? (
            <p className="text-xs text-muted">{formatTurkishMobile(phone)}</p>
          ) : null}
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            <span>
              <Link href="/kvkk" className="font-semibold underline" target="_blank">
                KVKK aydınlatma metnini
              </Link>{" "}
              okudum ve kişisel verilerimin randevu için işlenmesini kabul ediyorum.
            </span>
          </label>
          {turnstileSiteKey ? <Turnstile siteKey={turnstileSiteKey} onToken={setCaptchaToken} /> : null}
        </Card>
      ) : null}

      {error ? <Notice>{error}</Notice> : null}

      <div className="flex gap-2">
        {step > 0 ? (
          <Button type="button" variant="ghost" onClick={() => setStep((value) => value - 1)}>
            Geri
          </Button>
        ) : null}
        {step < 4 ? (
          <Button
            type="button"
            className="flex-1"
            disabled={(step === 0 && !service) || (step === 1 && !barber) || (step === 2 && !date) || (step === 3 && !slotIso)}
            onClick={() => setStep((value) => value + 1)}
          >
            Devam
          </Button>
        ) : (
          <Button type="button" className="flex-1" disabled={pending} onClick={submit}>
            {pending ? "Kaydediliyor…" : "Randevuyu onayla"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Turnstile({ siteKey, onToken }: { siteKey: string; onToken: (token: string) => void }) {
  const holder = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => {
      const turnstile = (window as unknown as { turnstile?: { render: (el: HTMLElement, opts: object) => void } }).turnstile;
      if (!holder.current || !turnstile) return;
      turnstile.render(holder.current, { sitekey: siteKey, callback: onToken });
    };
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [siteKey, onToken]);
  return <div ref={holder} />;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
