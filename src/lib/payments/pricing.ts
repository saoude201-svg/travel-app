/**
 * Server-authoritative pricing. The client never sends amounts — we always
 * recompute totals here from the room rate, nights, and rooms.
 *
 * ⚠️ LEGAL/TAX TOUCHPOINT: `LODGING_TAX_RATE` and `SERVICE_FEE_RATE` are
 * placeholders. Real lodging/occupancy taxes vary by city/state/country and
 * EU VAT/MOSS rules may apply. Replace this flat model with a real tax engine
 * (and per-destination rules) before taking real money. See README.
 */

export const LODGING_TAX_RATE = 0.12; // 12% placeholder occupancy tax
export const SERVICE_FEE_RATE = 0.05; // 5% placeholder platform service fee

export interface PricingInput {
  pricePerNightCents: number;
  nights: number;
  rooms: number;
}

export interface PriceBreakdown {
  roomSubtotalCents: number;
  taxesCents: number;
  feesCents: number;
  totalCents: number;
}

/** Round to the nearest cent (guards against fractional cents). */
function round(cents: number): number {
  return Math.round(cents);
}

export function computeStayPricing({
  pricePerNightCents,
  nights,
  rooms,
}: PricingInput): PriceBreakdown {
  if (!Number.isInteger(pricePerNightCents) || pricePerNightCents < 0) {
    throw new Error("pricePerNightCents must be a non-negative integer");
  }
  if (!Number.isInteger(nights) || nights < 1) {
    throw new Error("nights must be a positive integer");
  }
  if (!Number.isInteger(rooms) || rooms < 1) {
    throw new Error("rooms must be a positive integer");
  }

  const roomSubtotalCents = pricePerNightCents * nights * rooms;
  const taxesCents = round(roomSubtotalCents * LODGING_TAX_RATE);
  const feesCents = round(roomSubtotalCents * SERVICE_FEE_RATE);
  const totalCents = roomSubtotalCents + taxesCents + feesCents;

  return { roomSubtotalCents, taxesCents, feesCents, totalCents };
}
