import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function assertDateString(date: string): void {
  const match = DATE_RE.exec(date);
  if (!match) {
    throw new Error("Geçersiz tarih");
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    throw new Error("Geçersiz tarih");
  }
}

export function addCalendarDays(date: string, days: number): string {
  assertDateString(date);
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + days);
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utc.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Takvim gününün haftanın günü. 0 pazar … 6 cumartesi. Saat diliminden bağımsızdır. */
export function weekdayIndex(date: string): number {
  assertDateString(date);
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function calendarDateInZone(instant: Date, timeZone: string): string {
  return formatInTimeZone(instant, timeZone, "yyyy-MM-dd");
}

/** Salonun yerel gününde, gece yarısından itibaren `minuteOfDay` dakikadaki an. */
export function zonedDate(date: string, minuteOfDay: number, timeZone: string): Date {
  const extraDays = Math.floor(minuteOfDay / 1440);
  const minute = ((minuteOfDay % 1440) + 1440) % 1440;
  const resolved = addCalendarDays(date, extraDays);
  const hours = Math.floor(minute / 60);
  const mins = minute % 60;
  const stamp = `${resolved}T${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
  return fromZonedTime(stamp, timeZone);
}

export function dayBounds(date: string, timeZone: string): { start: Date; end: Date } {
  return {
    start: zonedDate(date, 0, timeZone),
    end: zonedDate(date, 1440, timeZone),
  };
}

export function formatMinuteOfDay(minute: number): string {
  const clamped = Math.max(0, Math.min(minute, 24 * 60));
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function parseMinuteOfDay(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours > 24 || mins > 59) return null;
  if (hours === 24 && mins !== 0) return null;
  return hours * 60 + mins;
}
