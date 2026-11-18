import { describe, expect, it } from "vitest";
import { getAvailableSlots } from "./slots";
import { addCalendarDays, weekdayIndex, zonedDate } from "./time";
import type { WorkingInterval } from "./types";

const TZ = "Europe/Istanbul";
const DATE = "2026-11-18";
const NOW = zonedDate(DATE, 8 * 60, TZ);

function hours(startHour: number, endHour: number, day = weekdayIndex(DATE)): WorkingInterval[] {
  return [{ dayOfWeek: day, startMinute: startHour * 60, endMinute: endHour * 60 }];
}

function iso(minute: number, date = DATE): string {
  return zonedDate(date, minute, TZ).toISOString();
}

describe("getAvailableSlots", () => {
  it("çalışma saati içinde 15 dakikalık ızgarada slot üretir", () => {
    const slots = getAvailableSlots({
      date: DATE,
      timeZone: TZ,
      durationMinutes: 30,
      workingHours: hours(9, 10),
      dayOff: false,
      busy: [],
      now: NOW,
    });
    expect(slots.map((slot) => slot.startsAt.toISOString())).toEqual([
      iso(9 * 60),
      iso(9 * 60 + 15),
      iso(9 * 60 + 30),
    ]);
    expect(slots[0]?.endsAt.toISOString()).toBe(iso(9 * 60 + 30));
  });

  it("İstanbul saati 09:00'ı UTC 06:00 olarak yazar", () => {
    const slots = getAvailableSlots({
      date: DATE,
      timeZone: TZ,
      durationMinutes: 30,
      workingHours: hours(9, 10),
      dayOff: false,
      busy: [],
      now: NOW,
    });
    expect(slots[0]?.startsAt.toISOString()).toBe("2026-11-18T06:00:00.000Z");
  });

  it("bitiş tam sınırda çakışma sayılmaz", () => {
    const slots = getAvailableSlots({
      date: DATE,
      timeZone: TZ,
      durationMinutes: 60,
      workingHours: hours(9, 11),
      dayOff: false,
      busy: [
        {
          startsAt: zonedDate(DATE, 9 * 60, TZ),
          endsAt: zonedDate(DATE, 9 * 60 + 30, TZ),
        },
      ],
      now: NOW,
    });
    expect(slots.map((slot) => slot.startsAt.toISOString())).toEqual([
      iso(9 * 60 + 30),
      iso(9 * 60 + 45),
      iso(10 * 60),
    ]);
  });

  it("öğle arasını aşan slot üretmez", () => {
    const slots = getAvailableSlots({
      date: DATE,
      timeZone: TZ,
      durationMinutes: 60,
      workingHours: [
        { dayOfWeek: weekdayIndex(DATE), startMinute: 9 * 60, endMinute: 12 * 60 },
        { dayOfWeek: weekdayIndex(DATE), startMinute: 13 * 60, endMinute: 17 * 60 },
      ],
      dayOff: false,
      busy: [],
      now: NOW,
    });
    const labels = slots.map((slot) => slot.startsAt.toISOString());
    expect(labels).toContain(iso(11 * 60));
    expect(labels).not.toContain(iso(11 * 60 + 15));
    expect(labels).toContain(iso(13 * 60));
    expect(labels).toContain(iso(16 * 60));
    expect(labels).not.toContain(iso(16 * 60 + 15));
  });

  it("09:10 başlangıcı 09:15 ızgarasına yuvarlanır", () => {
    const slots = getAvailableSlots({
      date: DATE,
      timeZone: TZ,
      durationMinutes: 30,
      workingHours: [{ dayOfWeek: weekdayIndex(DATE), startMinute: 9 * 60 + 10, endMinute: 10 * 60 }],
      dayOff: false,
      busy: [],
      now: NOW,
    });
    expect(slots.map((slot) => slot.startsAt.toISOString())).toEqual([
      iso(9 * 60 + 15),
      iso(9 * 60 + 30),
    ]);
  });

  it("izin gününde ve çalışma saati olmayan günde boş döner", () => {
    expect(
      getAvailableSlots({
        date: DATE,
        timeZone: TZ,
        durationMinutes: 30,
        workingHours: hours(9, 18),
        dayOff: true,
        busy: [],
        now: NOW,
      }),
    ).toEqual([]);

    expect(
      getAvailableSlots({
        date: DATE,
        timeZone: TZ,
        durationMinutes: 30,
        workingHours: hours(9, 18, (weekdayIndex(DATE) + 1) % 7),
        dayOff: false,
        busy: [],
        now: NOW,
      }),
    ).toEqual([]);
  });

  it("geçmiş günü ve 60 günden sonrasını kapatır", () => {
    const past = addCalendarDays(DATE, -1);
    const last = addCalendarDays(DATE, 60);
    const after = addCalendarDays(DATE, 61);
    const allWeek = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      dayOfWeek,
      startMinute: 9 * 60,
      endMinute: 12 * 60,
    }));
    expect(
      getAvailableSlots({
        date: past,
        timeZone: TZ,
        durationMinutes: 30,
        workingHours: allWeek,
        dayOff: false,
        busy: [],
        now: NOW,
      }),
    ).toEqual([]);
    expect(
      getAvailableSlots({
        date: last,
        timeZone: TZ,
        durationMinutes: 30,
        workingHours: allWeek,
        dayOff: false,
        busy: [],
        now: NOW,
      }).length,
    ).toBeGreaterThan(0);
    expect(
      getAvailableSlots({
        date: after,
        timeZone: TZ,
        durationMinutes: 30,
        workingHours: allWeek,
        dayOff: false,
        busy: [],
        now: NOW,
      }),
    ).toEqual([]);
  });

  it("bugün için yakın geçmiş saatleri eler", () => {
    const now = zonedDate(DATE, 10 * 60, TZ);
    const slots = getAvailableSlots({
      date: DATE,
      timeZone: TZ,
      durationMinutes: 30,
      workingHours: hours(9, 12),
      dayOff: false,
      busy: [],
      now,
      minLeadMinutes: 15,
    });
    expect(slots[0]?.startsAt.toISOString()).toBe(iso(10 * 60 + 15));
    expect(slots.at(-1)?.startsAt.toISOString()).toBe(iso(11 * 60 + 30));
  });

  it("çakışan çalışma aralıklarında aynı saati bir kez verir", () => {
    const dow = weekdayIndex(DATE);
    const slots = getAvailableSlots({
      date: DATE,
      timeZone: TZ,
      durationMinutes: 30,
      workingHours: [
        { dayOfWeek: dow, startMinute: 9 * 60, endMinute: 11 * 60 },
        { dayOfWeek: dow, startMinute: 10 * 60, endMinute: 12 * 60 },
      ],
      dayOff: false,
      busy: [],
      now: NOW,
    });
    const keys = slots.map((slot) => slot.startsAt.toISOString());
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain(iso(10 * 60));
  });

  it("aralıktan uzun hizmet için slot üretmez", () => {
    expect(
      getAvailableSlots({
        date: DATE,
        timeZone: TZ,
        durationMinutes: 90,
        workingHours: hours(9, 10),
        dayOff: false,
        busy: [],
        now: NOW,
      }),
    ).toEqual([]);
  });
});
