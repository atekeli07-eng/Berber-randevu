import { formatInTimeZone } from "date-fns-tz";
import { tr } from "date-fns/locale";
import { DEFAULT_TIME_ZONE } from "./constants";

export function formatSlotTime(instant: Date, timeZone: string = DEFAULT_TIME_ZONE): string {
  return formatInTimeZone(instant, timeZone, "HH:mm");
}

export function formatLongDate(instant: Date, timeZone: string = DEFAULT_TIME_ZONE): string {
  return formatInTimeZone(instant, timeZone, "d MMMM yyyy EEEE", { locale: tr });
}

export function formatDayHeading(date: string, timeZone: string = DEFAULT_TIME_ZONE): string {
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const utcNoon = new Date(Date.UTC(year, month - 1, day, 12));
  return formatInTimeZone(utcNoon, "UTC", "d MMMM yyyy EEEE", { locale: tr });
}
