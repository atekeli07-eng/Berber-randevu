import { MAX_DURATION_MINUTES, MIN_DURATION_MINUTES } from "./constants";

const NAME_RE = /^[\p{L}][\p{L}\s'.-]*$/u;
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TR_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  i: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  â: "a",
  î: "i",
  û: "u",
};

/** Türkçe karakterleri koruyarak URL parçası üretir. Veritabanındaki slugify ile aynı niyettedir. */
export function slugify(input: string): string {
  const lower = input.trim().toLocaleLowerCase("tr-TR");
  let folded = "";
  for (const char of lower) {
    folded += TR_MAP[char] ?? char;
  }
  let slug = folded
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug.length > 48) {
    slug = slug.slice(0, 48).replace(/-+$/g, "");
  }
  if (slug.length < 3) {
    slug = (slug ? `${slug}-salon` : "salon").slice(0, 48);
  }
  return slug;
}

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

export function normalizePersonName(input: string): string | null {
  const name = input.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) return null;
  if (!NAME_RE.test(name)) return null;
  return name;
}

/**
 * Türkiye cep numarasını 05XXXXXXXXX biçimine indirger.
 * 0532…, 532… ve +90 532… kabul edilir.
 */
export function normalizeTurkishMobile(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) {
    digits = `0${digits.slice(2)}`;
  } else if (digits.startsWith("5") && digits.length === 10) {
    digits = `0${digits}`;
  }
  if (!/^05\d{9}$/.test(digits)) return null;
  return digits;
}

export function formatTurkishMobile(phone: string): string {
  const normalized = normalizeTurkishMobile(phone) ?? phone;
  if (!/^05\d{9}$/.test(normalized)) return phone;
  return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7, 9)} ${normalized.slice(9, 11)}`;
}

export function toTelHref(phone: string): string {
  const mobile = normalizeTurkishMobile(phone);
  if (mobile) return `tel:+90${mobile.slice(1)}`;
  const digits = phone.replace(/\D/g, "");
  const national =
    digits.startsWith("90") && digits.length === 12
      ? `0${digits.slice(2)}`
      : digits.startsWith("0") && digits.length === 11
        ? digits
        : null;
  if (national) return `tel:+90${national.slice(1)}`;
  return `tel:${phone.replace(/\s/g, "")}`;
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim().toLocaleLowerCase("tr-TR"));
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8 && password.length <= 72;
}

export function parseTryToKurus(input: string): number | null {
  const cleaned = input.trim().replace(/\s/g, "").replace("₺", "").replace("TL", "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000) return null;
  return Math.round(value * 100);
}

export function formatTry(kurus: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(kurus / 100);
}

export function isValidDuration(minutes: number): boolean {
  return Number.isInteger(minutes) && minutes >= MIN_DURATION_MINUTES && minutes <= MAX_DURATION_MINUTES;
}

export type ServiceDraft = {
  name: string;
  duration_minutes: number;
  price_kurus: number;
  description: string | null;
};

/** Web paneli ve mobil uygulama aynı hizmet kurallarını kullanır. */
export function parseServiceDraft(input: {
  name: string;
  duration: string;
  price: string;
  description: string;
}): { ok: true; value: ServiceDraft } | { ok: false; error: string } {
  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) {
    return { ok: false, error: "Hizmet adı 2 ile 80 karakter arasında olmalı." };
  }
  if (!/^\d+$/.test(input.duration.trim())) {
    return { ok: false, error: "Süre 5 ile 480 dakika arasında tam sayı olmalı." };
  }
  const durationMinutes = Number(input.duration.trim());
  if (!isValidDuration(durationMinutes)) {
    return { ok: false, error: "Süre 5 ile 480 dakika arasında tam sayı olmalı." };
  }
  const priceKurus = parseTryToKurus(input.price);
  if (priceKurus === null) {
    return { ok: false, error: "Fiyatı TL olarak girin. Örnek: 250 veya 250,50" };
  }
  const description = input.description.trim().replace(/\s+/g, " ");
  if (description.length > 500) {
    return { ok: false, error: "Açıklama en fazla 500 karakter olabilir." };
  }
  return {
    ok: true,
    value: {
      name,
      duration_minutes: durationMinutes,
      price_kurus: priceKurus,
      description: description || null,
    },
  };
}

export function serviceDeleteBlockedMessage(active: boolean): string {
  if (active) {
    return "Bu hizmetin randevusu var. Silinemez; mevcut kayıtlar durur. Yayından kaldırılsın mı?";
  }
  return "Bu hizmetin randevusu var. Kayıtlar durduğu için silinemez.";
}
