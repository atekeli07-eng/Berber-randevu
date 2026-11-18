import { describe, expect, it } from "vitest";
import { canCustomerCancel } from "./policy";

describe("canCustomerCancel", () => {
  const start = new Date("2026-11-20T10:00:00.000Z");

  it("sınırdan önce iptale izin verir", () => {
    const now = new Date(start.getTime() - 3 * 60 * 60 * 1000);
    expect(canCustomerCancel(start, now, 2)).toBe(true);
  });

  it("sınırın içinde iptali kapatır", () => {
    const now = new Date(start.getTime() - 60 * 60 * 1000);
    expect(canCustomerCancel(start, now, 2)).toBe(false);
  });

  it("tam sınırda iptale izin verir", () => {
    const now = new Date(start.getTime() - 2 * 60 * 60 * 1000);
    expect(canCustomerCancel(start, now, 2)).toBe(true);
  });

  it("sıfır saatte başlangıca kadar açıktır", () => {
    expect(canCustomerCancel(start, new Date(start.getTime() - 1000), 0)).toBe(true);
    expect(canCustomerCancel(start, new Date(start.getTime() + 1000), 0)).toBe(false);
  });
});
