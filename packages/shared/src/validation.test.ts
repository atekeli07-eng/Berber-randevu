import { describe, expect, it } from "vitest";
import { normalizeInstagram, normalizeMapsUrl, normalizeSalonPhone, parseSalonProfile } from "./branding";
import {
  formatTurkishMobile,
  isValidSlug,
  normalizePersonName,
  normalizeTurkishMobile,
  parseTryToKurus,
  slugify,
} from "./validation";

describe("telefon", () => {
  it("Türkiye cep numarası biçimlerini 05XXXXXXXXX yapar", () => {
    expect(normalizeTurkishMobile("0532 111 22 33")).toBe("05321112233");
    expect(normalizeTurkishMobile("+90 532 111 22 33")).toBe("05321112233");
    expect(normalizeTurkishMobile("5321112233")).toBe("05321112233");
    expect(normalizeTurkishMobile("0212 111 22 33")).toBeNull();
    expect(normalizeTurkishMobile("0532111223")).toBeNull();
  });

  it("ekranda gruplayarak yazar", () => {
    expect(formatTurkishMobile("05321112233")).toBe("0532 111 22 33");
  });
});

describe("ad ve slug", () => {
  it("adı temizler", () => {
    expect(normalizePersonName("  Ayşe   Yılmaz ")).toBe("Ayşe Yılmaz");
    expect(normalizePersonName("A")).toBeNull();
    expect(normalizePersonName("Ali 1")).toBeNull();
  });

  it("Türkçe salon adından slug üretir", () => {
    expect(slugify("Sakal & Makas")).toBe("sakal-makas");
    expect(slugify("İstanbul Berberi")).toBe("istanbul-berberi");
    expect(slugify("Çağrı Ünal")).toBe("cagri-unal");
    expect(isValidSlug(slugify("Saç"))).toBe(true);
    expect(isValidSlug("A")).toBe(false);
    expect(isValidSlug("-salon")).toBe(false);
  });
});

describe("salon profili", () => {
  it("telefon, instagram ve harita bağlantısını temizler", () => {
    expect(normalizeSalonPhone("0212 293 00 00")).toBe("02122930000");
    expect(normalizeSalonPhone("+90 532 111 22 33")).toBe("05321112233");
    expect(normalizeInstagram("@Sakal.Makas")).toBe("Sakal.Makas");
    expect(normalizeInstagram("https://instagram.com/sakal.makas/")).toBe("sakal.makas");
    expect(normalizeMapsUrl("https://maps.app.goo.gl/abc")).toBe("https://maps.app.goo.gl/abc");
    expect(normalizeMapsUrl("http://maps.google.com/")).toBeNull();
    const parsed = parseSalonProfile({
      name: "Sakal & Makas",
      address: "Turnacıbaşı Sokak 14",
      district: "Beyoğlu",
      city: "İstanbul",
      phone: "0212 293 00 00",
      description: "Kısa tanıtım",
      mapsUrl: "https://maps.app.goo.gl/abc",
      instagram: "@sakal.makas",
      hoursSummary: "Salı–cumartesi 10:00–20:00",
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.phone).toBe("02122930000");
      expect(parsed.value.instagram).toBe("sakal.makas");
      expect(parsed.value.district).toBe("Beyoğlu");
    }
  });
});

describe("fiyat", () => {
  it("TL yazılarını kuruşa çevirir", () => {
    expect(parseTryToKurus("250")).toBe(25000);
    expect(parseTryToKurus("250,5")).toBe(25050);
    expect(parseTryToKurus("1.250,50")).toBe(125050);
    expect(parseTryToKurus("10.5")).toBe(1050);
    expect(parseTryToKurus("abc")).toBeNull();
    expect(parseTryToKurus("-5")).toBeNull();
  });
});
