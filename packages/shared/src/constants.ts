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

/** Yüklemeden önce kabul edilen ham dosya. Küçültme bundan sonra yapılır. */
export const SALON_IMAGE_INPUT_MAX_BYTES = 8 * 1024 * 1024;
/** Storage’a yazılan dosyanın üst sınırı. Kova limiti ile aynıdır. */
export const SALON_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const SALON_LOGO_MAX_EDGE = 512;
export const SALON_COVER_MAX_EDGE = 1600;
export const SALON_MEDIA_BUCKET = "salon-media";

export const WEEKDAYS = [
  { value: 1, short: "Pzt", long: "Pazartesi" },
  { value: 2, short: "Sal", long: "Salı" },
  { value: 3, short: "Çar", long: "Çarşamba" },
  { value: 4, short: "Per", long: "Perşembe" },
  { value: 5, short: "Cum", long: "Cuma" },
  { value: 6, short: "Cmt", long: "Cumartesi" },
  { value: 0, short: "Paz", long: "Pazar" },
] as const;

export const KVKK_CONSENT_VERSION = "2026-11-18";

export const APPOINTMENT_STATUS = {
  booked: "booked",
  done: "done",
  cancelled: "cancelled",
  blocked: "blocked",
} as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  booked: "Rezerve",
  done: "Tamamlandı",
  cancelled: "İptal",
  blocked: "Kapalı",
};
