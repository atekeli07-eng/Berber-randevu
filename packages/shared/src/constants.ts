/** Salon takvimi her zaman bu saat dilimindedir. */
export const DEFAULT_TIME_ZONE = "Europe/Istanbul";

/** Müsait saatler bu adımla üretilir. Veritabanı doğrulaması da aynı kuralı kullanır. */
export const SLOT_STEP_MINUTES = 15;

/** Müşteri, şu andan en az bu kadar dakika sonrasına randevu alabilir. */
export const MIN_LEAD_MINUTES = 15;

/** Bugünden itibaren en fazla bu kadar gün ileriye randevu açılır. */
export const MAX_DAYS_AHEAD = 60;

export const MIN_DURATION_MINUTES = 5;
export const MAX_DURATION_MINUTES = 480;

export const WEEKDAYS = [
  { value: 1, short: "Pzt", long: "Pazartesi" },
  { value: 2, short: "Sal", long: "Salı" },
  { value: 3, short: "Çar", long: "Çarşamba" },
  { value: 4, short: "Per", long: "Perşembe" },
  { value: 5, short: "Cum", long: "Cuma" },
  { value: 6, short: "Cmt", long: "Cumartesi" },
  { value: 0, short: "Paz", long: "Pazar" },
] as const;

export const APPOINTMENT_STATUS = {
  booked: "booked",
  done: "done",
  cancelled: "cancelled",
} as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  booked: "Rezerve",
  done: "Tamamlandı",
  cancelled: "İptal",
};
