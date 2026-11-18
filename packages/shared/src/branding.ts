import {
  SALON_IMAGE_INPUT_MAX_BYTES,
  SALON_IMAGE_MAX_BYTES,
  SALON_MEDIA_BUCKET,
} from "./constants";

const INSTAGRAM_RE = /^[A-Za-z0-9._]{1,30}$/;
const SALON_PHONE_RE = /^0\d{10}$/;

export type SalonProfileInput = {
  name: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  description: string;
  mapsUrl: string;
  instagram: string;
  hoursSummary: string;
};

export type SalonProfileValues = {
  name: string;
  address: string | null;
  district: string | null;
  city: string | null;
  phone: string | null;
  description: string | null;
  maps_url: string | null;
  instagram: string | null;
  hours_summary: string | null;
};

function collapse(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

function optionalText(input: string, max: number, label: string): { ok: true; value: string | null } | { ok: false; error: string } {
  const value = collapse(input);
  if (!value) return { ok: true, value: null };
  if (value.length > max) return { ok: false, error: `${label} en fazla ${max} karakter olabilir.` };
  return { ok: true, value };
}

/** Salon telefonu: cep veya sabit hat, ulusal 11 hane (0…). */
export function normalizeSalonPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("90") && digits.length === 12) digits = `0${digits.slice(2)}`;
  if (digits.startsWith("5") && digits.length === 10) digits = `0${digits}`;
  if (!SALON_PHONE_RE.test(digits)) return null;
  return digits;
}

export function formatSalonPhone(phone: string): string {
  const normalized = normalizeSalonPhone(phone);
  if (!normalized) return phone;
  return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7, 9)} ${normalized.slice(9, 11)}`;
}

export function normalizeInstagram(input: string): string | null {
  let value = input.trim();
  if (!value) return null;
  value = value.replace(/^@+/, "");
  const fromUrl = value.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  if (fromUrl?.[1]) value = fromUrl[1];
  value = value.replace(/\/+$/, "");
  if (!INSTAGRAM_RE.test(value)) return null;
  return value;
}

export function normalizeMapsUrl(input: string): string | null {
  const value = input.trim();
  if (!value || value.length > 500 || !value.startsWith("https://")) return null;
  const match = /^https:\/\/([^/?#]+)/.exec(value);
  const host = match?.[1]?.replace(/^www\./, "").toLowerCase();
  if (!host) return null;
  const path = value.slice(`https://${match?.[1] ?? ""}`.length);
  const googleMaps =
    ((host === "google.com" || host.endsWith(".google.com")) && path.startsWith("/maps")) ||
    host === "maps.google.com" ||
    host.startsWith("maps.google.");
  const shortLink = host === "maps.app.goo.gl" || (host === "goo.gl" && path.startsWith("/maps"));
  if (!googleMaps && !shortLink) return null;
  return value;
}

export function parseSalonProfile(input: SalonProfileInput): { ok: true; value: SalonProfileValues } | { ok: false; error: string } {
  const name = collapse(input.name);
  if (name.length < 2 || name.length > 80) {
    return { ok: false, error: "Salon adı 2 ile 80 karakter arasında olmalı." };
  }
  const address = optionalText(input.address, 160, "Sokak");
  if (!address.ok) return address;
  const districtRaw = collapse(input.district);
  if (districtRaw && districtRaw.length < 2) {
    return { ok: false, error: "İlçe en az 2 karakter olmalı." };
  }
  const district = optionalText(input.district, 80, "İlçe");
  if (!district.ok) return district;
  const city = optionalText(input.city, 80, "Şehir");
  if (!city.ok) return city;
  const description = optionalText(input.description, 500, "Tanıtım");
  if (!description.ok) return description;
  const hours = optionalText(input.hoursSummary, 160, "Çalışma saati özeti");
  if (!hours.ok) return hours;

  const phoneRaw = input.phone.trim();
  let phone: string | null = null;
  if (phoneRaw) {
    phone = normalizeSalonPhone(phoneRaw);
    if (!phone) return { ok: false, error: "Telefon 0 ile başlayan 11 haneli olmalı." };
  }

  const mapsRaw = input.mapsUrl.trim();
  let mapsUrl: string | null = null;
  if (mapsRaw) {
    mapsUrl = normalizeMapsUrl(mapsRaw);
    if (!mapsUrl) return { ok: false, error: "Harita bağlantısı bir Google Maps adresi olmalı." };
  }

  const instagramRaw = input.instagram.trim();
  let instagram: string | null = null;
  if (instagramRaw) {
    instagram = normalizeInstagram(instagramRaw);
    if (!instagram) return { ok: false, error: "Instagram kullanıcı adı harf, rakam, nokta ve alt çizgi içerebilir." };
  }

  return {
    ok: true,
    value: {
      name,
      address: address.value,
      district: district.value,
      city: city.value,
      phone,
      description: description.value,
      maps_url: mapsUrl,
      instagram,
      hours_summary: hours.value,
    },
  };
}

export function formatSalonAddress(parts: {
  address?: string | null;
  district?: string | null;
  city?: string | null;
}): string {
  return [parts.address, parts.district, parts.city].map((part) => part?.trim()).filter(Boolean).join(", ");
}

export function instagramUrl(handle: string): string {
  return `https://instagram.com/${handle.replace(/^@+/, "")}`;
}

export function isAllowedSalonImageType(mime: string): boolean {
  return mime === "image/jpeg" || mime === "image/png" || mime === "image/webp";
}

export function salonImageTooLarge(bytes: number, alreadyResized: boolean): string | null {
  if (alreadyResized) {
    return bytes > SALON_IMAGE_MAX_BYTES ? "Görsel küçültüldükten sonra hâlâ 2 MB üzerinde." : null;
  }
  return bytes > SALON_IMAGE_INPUT_MAX_BYTES ? "Görsel 8 MB'dan küçük olmalı." : null;
}

export function salonMediaObjectPath(salonId: string, kind: "logo" | "cover", extension: "webp" | "jpg"): string {
  return `${salonId}/${kind}.${extension}`;
}

/** Depolama yolu veya önizleme için yerel/tam adres. */
export function resolveSalonImage(
  supabaseUrl: string | null | undefined,
  path: string | null | undefined,
  version?: string | null,
): string | null {
  if (!path) return null;
  if (path.startsWith("/") || path.startsWith("http://") || path.startsWith("https://")) return path;
  if (!supabaseUrl) return null;
  const base = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${SALON_MEDIA_BUCKET}/${path}`;
  return version ? `${base}?v=${encodeURIComponent(version)}` : base;
}
