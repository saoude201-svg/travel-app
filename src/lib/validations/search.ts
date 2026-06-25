import { z } from "zod";
import { toISODate } from "@/lib/utils";
import type { HotelSearchParams, HotelSortKey, SearchFilters } from "@/lib/providers/hotel/types";

const SORT_KEYS: HotelSortKey[] = ["recommended", "price_asc", "price_desc", "rating_desc"];

/** Default stay window: ~30 days out, 3 nights. */
export function defaultDates() {
  const checkIn = new Date();
  checkIn.setUTCDate(checkIn.getUTCDate() + 30);
  const checkOut = new Date(checkIn);
  checkOut.setUTCDate(checkOut.getUTCDate() + 3);
  return { checkIn: toISODate(checkIn), checkOut: toISODate(checkOut) };
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const numList = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n));

const strList = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Parse loose URL search params into validated provider search params.
 * Invalid values fall back to sensible defaults rather than throwing, so a
 * hand-edited URL never 500s the search page.
 */
export function parseSearchParams(raw: RawSearchParams): HotelSearchParams {
  const defaults = defaultDates();

  const checkIn = isoDate.safeParse(first(raw.checkIn)).success
    ? (first(raw.checkIn) as string)
    : defaults.checkIn;
  let checkOut = isoDate.safeParse(first(raw.checkOut)).success
    ? (first(raw.checkOut) as string)
    : defaults.checkOut;
  if (checkOut <= checkIn) checkOut = defaults.checkOut > checkIn ? defaults.checkOut : checkIn;

  const guests = clampInt(first(raw.guests), 1, 16, 2);
  const rooms = clampInt(first(raw.rooms), 1, 8, 1);
  const page = clampInt(first(raw.page), 1, 1000, 1);

  const dollarsToCents = (v: string | undefined) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined;
  };

  const filters: SearchFilters = {
    priceMinCents: dollarsToCents(first(raw.priceMin)),
    priceMaxCents: dollarsToCents(first(raw.priceMax)),
    starRatings: numList(first(raw.stars)).filter((n) => n >= 1 && n <= 5),
    minGuestRating: (() => {
      const n = Number(first(raw.minRating));
      return Number.isFinite(n) && n > 0 && n <= 10 ? n : undefined;
    })(),
    amenities: strList(first(raw.amenities)),
    freeCancellation: first(raw.freeCancellation) === "1" || first(raw.freeCancellation) === "true",
  };
  // Drop empties so the provider's `where` stays clean.
  if (!filters.starRatings?.length) delete filters.starRatings;
  if (!filters.amenities?.length) delete filters.amenities;
  if (!filters.freeCancellation) delete filters.freeCancellation;

  const sortRaw = first(raw.sort) as HotelSortKey | undefined;
  const sort: HotelSortKey = sortRaw && SORT_KEYS.includes(sortRaw) ? sortRaw : "recommended";

  return {
    destinationSlug: first(raw.destination) || undefined,
    query: first(raw.q) || undefined,
    checkIn,
    checkOut,
    guests,
    rooms,
    filters,
    sort,
    page,
    pageSize: 12,
  };
}

function clampInt(v: string | undefined, min: number, max: number, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Serialize provider params back into a URLSearchParams for links/navigation. */
export function searchParamsToQuery(params: Partial<HotelSearchParams>): string {
  const q = new URLSearchParams();
  if (params.destinationSlug) q.set("destination", params.destinationSlug);
  if (params.query) q.set("q", params.query);
  if (params.checkIn) q.set("checkIn", params.checkIn);
  if (params.checkOut) q.set("checkOut", params.checkOut);
  if (params.guests) q.set("guests", String(params.guests));
  if (params.rooms) q.set("rooms", String(params.rooms));
  if (params.sort && params.sort !== "recommended") q.set("sort", params.sort);
  if (params.page && params.page > 1) q.set("page", String(params.page));
  const f = params.filters;
  if (f) {
    if (f.priceMinCents != null) q.set("priceMin", String(Math.round(f.priceMinCents / 100)));
    if (f.priceMaxCents != null) q.set("priceMax", String(Math.round(f.priceMaxCents / 100)));
    if (f.starRatings?.length) q.set("stars", f.starRatings.join(","));
    if (f.minGuestRating) q.set("minRating", String(f.minGuestRating));
    if (f.amenities?.length) q.set("amenities", f.amenities.join(","));
    if (f.freeCancellation) q.set("freeCancellation", "1");
  }
  return q.toString();
}
