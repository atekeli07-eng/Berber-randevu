import { describe, expect, it } from "vitest";
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
