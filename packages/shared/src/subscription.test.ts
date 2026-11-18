import { describe, expect, it } from "vitest";
import {
  addCalendarMonths,
  extendPaidUntil,
  formatIban,
  normalizeIban,
  salonAcceptsBookings,
  subscriptionReminder,
  subscriptionStatus,
  wholeDaysLeft,
} from "./subscription";

const NOW = new Date("2026-11-18T12:00:00.000Z");

function daysFrom(now: Date, days: number): Date {
  return new Date(now.getTime() + days * 86_400_000);
}

describe("abonelik durumu", () => {
  it("deneme bitmeden trial döner ve randevu kabul eder", () => {
    const input = { trialEndsAt: daysFrom(NOW, 10), paidUntil: null, suspended: false, now: NOW };
    expect(subscriptionStatus(input)).toBe("trial");
    expect(salonAcceptsBookings(input)).toBe(true);
  });

  it("deneme bitince süre doldu sayılır ve randevu kapanır", () => {
    const input = { trialEndsAt: daysFrom(NOW, -1), paidUntil: null, suspended: false, now: NOW };
    expect(subscriptionStatus(input)).toBe("past_due");
    expect(salonAcceptsBookings(input)).toBe(false);
  });

  it("ödeme gelecekse deneme bitmiş olsa da aktiftir", () => {
    const input = {
      trialEndsAt: daysFrom(NOW, -5),
      paidUntil: daysFrom(NOW, 20),
      suspended: false,
      now: NOW,
    };
    expect(subscriptionStatus(input)).toBe("active");
    expect(salonAcceptsBookings(input)).toBe(true);
  });

  it("ödeme varsa deneme sürerken de aktif sayılır", () => {
    const input = {
      trialEndsAt: daysFrom(NOW, 12),
      paidUntil: daysFrom(NOW, 3),
      suspended: false,
      now: NOW,
    };
    expect(subscriptionStatus(input)).toBe("active");
  });

  it("askı, ödemesi süren salonu da kapatır", () => {
    const input = {
      trialEndsAt: daysFrom(NOW, 12),
      paidUntil: daysFrom(NOW, 40),
      suspended: true,
      now: NOW,
    };
    expect(subscriptionStatus(input)).toBe("suspended");
    expect(salonAcceptsBookings(input)).toBe(false);
  });

  it("şema yokken denemeyi açık bırakır", () => {
    expect(subscriptionStatus({ trialEndsAt: null, suspended: false, now: NOW })).toBe("trial");
  });
});

describe("hatırlatma ve gün", () => {
  it("7 gün ve daha az kaldıysa uyarır", () => {
    const input = { trialEndsAt: daysFrom(NOW, 7), paidUntil: null, suspended: false, now: NOW };
    expect(subscriptionReminder(input)).toBe(true);
    expect(wholeDaysLeft(daysFrom(NOW, 7), NOW)).toBe(7);
  });

  it("8 gün kala uyarı vermez", () => {
    const input = { trialEndsAt: daysFrom(NOW, 8), paidUntil: null, suspended: false, now: NOW };
    expect(subscriptionReminder(input)).toBe(false);
  });

  it("süresi dolmuş salonda hatırlatma yoktur", () => {
    const input = { trialEndsAt: daysFrom(NOW, -1), paidUntil: null, suspended: false, now: NOW };
    expect(subscriptionReminder(input)).toBe(false);
  });
});

describe("süre uzatma", () => {
  it("bitmiş veya boş ödemeyi bugünden uzatır", () => {
    const next = extendPaidUntil(daysFrom(NOW, -3), 1, NOW);
    expect(next.toISOString()).toBe(addCalendarMonths(NOW, 1).toISOString());
    expect(extendPaidUntil(null, 1, NOW).toISOString()).toBe(addCalendarMonths(NOW, 1).toISOString());
  });

  it("devam eden ödemenin üstüne ekler", () => {
    const paid = daysFrom(NOW, 10);
    expect(extendPaidUntil(paid, 1, NOW).toISOString()).toBe(addCalendarMonths(paid, 1).toISOString());
  });

  it("31 Ocak artı bir ay Şubat sonuna iner", () => {
    const jan = new Date("2026-01-31T15:00:00.000Z");
    expect(addCalendarMonths(jan, 1).toISOString().startsWith("2026-02-28")).toBe(true);
  });

  it("ay sayısı sınır dışını reddeder", () => {
    expect(() => extendPaidUntil(null, 0, NOW)).toThrow(/1 ile 24/);
  });
});

describe("IBAN", () => {
  it("boş değeri kabul eder ve TR IBAN’ı sıkıştırır", () => {
    expect(normalizeIban("  ")).toBe("");
    expect(normalizeIban("tr33 0006 1005 1978 6457 8413 26")).toBe("TR330006100519786457841326");
    expect(formatIban("TR330006100519786457841326")).toBe("TR33 0006 1005 1978 6457 8413 26");
  });

  it("eksik IBAN’ı reddeder", () => {
    expect(normalizeIban("TR33")).toBeNull();
  });
});
