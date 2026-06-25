import { describe, it, expect } from "vitest";
import {
  computeStayPricing,
  LODGING_TAX_RATE,
  SERVICE_FEE_RATE,
} from "@/lib/payments/pricing";

describe("computeStayPricing", () => {
  it("computes subtotal, tax, fees, and total for a single room", () => {
    const r = computeStayPricing({ pricePerNightCents: 20000, nights: 3, rooms: 1 });
    expect(r.roomSubtotalCents).toBe(60000);
    expect(r.taxesCents).toBe(Math.round(60000 * LODGING_TAX_RATE));
    expect(r.feesCents).toBe(Math.round(60000 * SERVICE_FEE_RATE));
    expect(r.totalCents).toBe(r.roomSubtotalCents + r.taxesCents + r.feesCents);
  });

  it("scales with rooms and nights", () => {
    const r = computeStayPricing({ pricePerNightCents: 15000, nights: 4, rooms: 2 });
    expect(r.roomSubtotalCents).toBe(15000 * 4 * 2);
  });

  it("rounds tax/fees to whole cents", () => {
    const r = computeStayPricing({ pricePerNightCents: 9999, nights: 1, rooms: 1 });
    expect(Number.isInteger(r.taxesCents)).toBe(true);
    expect(Number.isInteger(r.feesCents)).toBe(true);
    expect(Number.isInteger(r.totalCents)).toBe(true);
  });

  it("rejects non-positive nights and rooms", () => {
    expect(() => computeStayPricing({ pricePerNightCents: 100, nights: 0, rooms: 1 })).toThrow();
    expect(() => computeStayPricing({ pricePerNightCents: 100, nights: 1, rooms: 0 })).toThrow();
  });

  it("rejects negative or fractional prices", () => {
    expect(() => computeStayPricing({ pricePerNightCents: -1, nights: 1, rooms: 1 })).toThrow();
    expect(() => computeStayPricing({ pricePerNightCents: 100.5, nights: 1, rooms: 1 })).toThrow();
  });
});
