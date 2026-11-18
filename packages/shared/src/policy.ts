/** Müşteri, randevu başlangıcına en az `cutoffHours` saat varken iptal edebilir. */
export function canCustomerCancel(startsAt: Date, now: Date, cutoffHours: number): boolean {
  if (!Number.isFinite(cutoffHours) || cutoffHours < 0) return false;
  return startsAt.getTime() - now.getTime() >= cutoffHours * 60 * 60 * 1000;
}

export function customerCancelHint(cutoffHours: number): string {
  if (cutoffHours <= 0) return "Randevu başlayana kadar iptal edebilirsiniz.";
  return `Randevuya ${cutoffHours} saatten az kala iptal edilemez.`;
}
