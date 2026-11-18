export const SUBSCRIPTION_STATUSES = ["trial", "active", "past_due", "suspended"] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trial: "Deneme",
  active: "Aktif",
  past_due: "Süresi doldu",
  suspended: "Askıda",
};

export type BillingInput = {
  trialEndsAt?: Date | string | null;
  paidUntil?: Date | string | null;
  suspended?: boolean | null;
  now?: Date;
};

const DAY_MS = 86_400_000;

function parseDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Salonun şu anki abonelik durumu.
 * Askı her şeyin önündedir. Ödenmiş süre varsa aktif sayılır.
 * Deneme, ödeme yokken ve trial bitmeden geçerlidir.
 * trialEndsAt yoksa şema henüz uygulanmamış kabul edilir ve deneme açık kalır.
 */
export function subscriptionStatus(input: BillingInput): SubscriptionStatus {
  if (input.suspended) return "suspended";
  const now = input.now ?? new Date();
  const trial = parseDate(input.trialEndsAt);
  if (!trial) return "trial";
  const paid = parseDate(input.paidUntil);
  if (paid && paid.getTime() > now.getTime()) return "active";
  if (trial.getTime() > now.getTime()) return "trial";
  return "past_due";
}

export function salonAcceptsBookings(input: BillingInput): boolean {
  const status = subscriptionStatus(input);
  return status === "trial" || status === "active";
}

/** Erişimin bittiği an. Kapalı salonlarda null. */
export function accessEndsAt(input: BillingInput): Date | null {
  const status = subscriptionStatus(input);
  if (status === "active") return parseDate(input.paidUntil);
  if (status === "trial") return parseDate(input.trialEndsAt);
  return null;
}

/** Takvim günü değil, yukarı yuvarlanmış tam gün. Bitiş geçmişse 0. */
export function wholeDaysLeft(end: Date, now = new Date()): number {
  const ms = end.getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / DAY_MS);
}

export function subscriptionReminder(input: BillingInput, withinDays = 7): boolean {
  if (!salonAcceptsBookings(input)) return false;
  const end = accessEndsAt(input);
  if (!end) return false;
  const days = wholeDaysLeft(end, input.now ?? new Date());
  return days > 0 && days <= withinDays;
}

/** Postgres `timestamp + interval 'n months'` ile aynı gün kısaltması. */
export function addCalendarMonths(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const probe = new Date(Date.UTC(year, month + months, 1, date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()));
  const lastDay = new Date(Date.UTC(probe.getUTCFullYear(), probe.getUTCMonth() + 1, 0)).getUTCDate();
  probe.setUTCDate(Math.min(day, lastDay));
  return probe;
}

/** Ödenen süreyi, bitiş gelecekteyse oradan, değilse şimdiden uzatır. */
export function extendPaidUntil(paidUntil: Date | string | null | undefined, months: number, now = new Date()): Date {
  if (!Number.isInteger(months) || months < 1 || months > 24) {
    throw new Error("Ay sayısı 1 ile 24 arasında olmalı");
  }
  const paid = parseDate(paidUntil);
  const base = paid && paid.getTime() > now.getTime() ? paid : now;
  return addCalendarMonths(base, months);
}

/** Boş IBAN kabul edilir. Doluysa TR ve 24 rakam. */
export function normalizeIban(input: string): string | null {
  const compact = input.replace(/\s+/g, "").toUpperCase();
  if (!compact) return "";
  if (!/^TR\d{24}$/.test(compact)) return null;
  return compact;
}

export function formatIban(iban: string): string {
  const compact = iban.replace(/\s+/g, "").toUpperCase();
  return compact.replace(/(.{4})/g, "$1 ").trim();
}
