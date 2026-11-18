import {
  MAX_DAYS_AHEAD,
  MIN_LEAD_MINUTES,
  SLOT_STEP_MINUTES,
} from "./constants";
import type { BusyRange, TimeSlot, WorkingInterval } from "./types";
import { addCalendarDays, calendarDateInZone, weekdayIndex, zonedDate } from "./time";

export type AvailableSlotsInput = {
  /** Salonun yerel takvim günü, YYYY-MM-DD. */
  date: string;
  timeZone: string;
  durationMinutes: number;
  workingHours: WorkingInterval[];
  dayOff: boolean;
  /** Yalnızca iptal edilmemiş randevular verilmelidir. */
  busy: BusyRange[];
  now?: Date;
  stepMinutes?: number;
  minLeadMinutes?: number;
  maxDaysAhead?: number;
};

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Bir personelin seçilen gündeki müsait başlangıç saatleri.
 *
 * Kurallar (veritabanındaki randevu doğrulamasıyla aynıdır):
 * - Aralıklar yarı açıktır: [başlangıç, bitiş).
 * - Başlangıçlar gün içi `stepMinutes` ızgarasına yuvarlanır (varsayılan 15).
 * - Hizmet süresi tek bir çalışma aralığının içine sığmalıdır.
 * - İzin gününde ve geçmişte slot yoktur.
 * - En fazla `maxDaysAhead` gün sonrasına kadar bakılır.
 * - Şu andan `minLeadMinutes` dakika sonrasından önceki saatler elenir.
 */
export function getAvailableSlots(input: AvailableSlotsInput): TimeSlot[] {
  const step = input.stepMinutes ?? SLOT_STEP_MINUTES;
  const lead = input.minLeadMinutes ?? MIN_LEAD_MINUTES;
  const horizon = input.maxDaysAhead ?? MAX_DAYS_AHEAD;
  if (step <= 0 || input.durationMinutes <= 0) {
    throw new Error("Süre pozitif olmalı");
  }
  if (input.dayOff) return [];

  const now = input.now ?? new Date();
  const today = calendarDateInZone(now, input.timeZone);
  const lastDay = addCalendarDays(today, horizon);
  if (input.date < today || input.date > lastDay) return [];

  const dow = weekdayIndex(input.date);
  const intervals = input.workingHours
    .filter(
      (interval) =>
        interval.dayOfWeek === dow &&
        interval.endMinute > interval.startMinute &&
        interval.startMinute >= 0 &&
        interval.endMinute <= 24 * 60,
    )
    .sort((a, b) => a.startMinute - b.startMinute);

  const earliest = now.getTime() + lead * 60_000;
  const seen = new Set<number>();
  const slots: TimeSlot[] = [];

  for (const interval of intervals) {
    let minute = Math.ceil(interval.startMinute / step) * step;
    while (minute + input.durationMinutes <= interval.endMinute) {
      const startsAt = zonedDate(input.date, minute, input.timeZone);
      const endsAt = zonedDate(input.date, minute + input.durationMinutes, input.timeZone);
      const key = startsAt.getTime();
      const blocked = input.busy.some(
        (range) =>
          range.endsAt > range.startsAt &&
          rangesOverlap(startsAt, endsAt, range.startsAt, range.endsAt),
      );
      if (key >= earliest && !blocked && !seen.has(key)) {
        seen.add(key);
        slots.push({ startsAt, endsAt });
      }
      minute += step;
    }
  }

  slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  return slots;
}
