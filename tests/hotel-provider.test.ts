import { describe, it, expect, beforeAll } from "vitest";
import {
  getHotelProvider,
  __resetHotelProvider,
  ProviderError,
  type HotelProvider,
} from "@/lib/providers/hotel";
import { MockHotelProvider } from "@/lib/providers/hotel/mock";
import { RealHotelProvider } from "@/lib/providers/hotel/real";
import { db } from "@/lib/db";

// Dates well in the future to avoid clashing with seeded bookings.
const CHECK_IN = "2027-09-10";
const CHECK_OUT = "2027-09-13";

describe("provider factory", () => {
  it("returns the mock provider by default", () => {
    __resetHotelProvider();
    process.env.HOTEL_PROVIDER = "mock";
    expect(getHotelProvider()).toBeInstanceOf(MockHotelProvider);
  });

  it("returns the real provider when HOTEL_PROVIDER=real", () => {
    __resetHotelProvider();
    process.env.HOTEL_PROVIDER = "real";
    expect(getHotelProvider()).toBeInstanceOf(RealHotelProvider);
    __resetHotelProvider();
    process.env.HOTEL_PROVIDER = "mock";
  });
});

describe("RealHotelProvider stub", () => {
  it("throws NOT_IMPLEMENTED when unconfigured", async () => {
    const real = new RealHotelProvider();
    await expect(real.search({ checkIn: CHECK_IN, checkOut: CHECK_OUT, guests: 2, rooms: 1 }))
      .rejects.toBeInstanceOf(ProviderError);
  });
});

describe("MockHotelProvider (DB-backed)", () => {
  let provider: HotelProvider;
  let sampleSlug: string;

  beforeAll(async () => {
    provider = new MockHotelProvider();
    const d = await db.destination.findFirst({ orderBy: { name: "asc" } });
    sampleSlug = d!.slug;
  });

  it("searches a destination and returns paginated results with facets", async () => {
    const res = await provider.search({
      destinationSlug: sampleSlug,
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      guests: 2,
      rooms: 1,
      pageSize: 5,
    });
    expect(res.hotels.length).toBeGreaterThan(0);
    expect(res.hotels.length).toBeLessThanOrEqual(5);
    expect(res.total).toBeGreaterThanOrEqual(res.hotels.length);
    expect(res.facets.priceRange.maxCents).toBeGreaterThanOrEqual(res.facets.priceRange.minCents);
    // stay total = nightly * 3 nights
    const h = res.hotels[0];
    expect(h.stayTotalCents).toBe(h.nightlyFromCents * 3);
  });

  it("applies star-rating and price filters", async () => {
    const res = await provider.search({
      destinationSlug: sampleSlug,
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      guests: 2,
      rooms: 1,
      filters: { starRatings: [5] },
    });
    expect(res.hotels.every((h) => h.starRating === 5)).toBe(true);
  });

  it("sorts by price ascending", async () => {
    const res = await provider.search({
      destinationSlug: sampleSlug,
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      guests: 2,
      rooms: 1,
      sort: "price_asc",
    });
    const prices = res.hotels.map((h) => h.nightlyFromCents);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it("gets details with rooms and reviews", async () => {
    const detail = await provider.getDetails(await firstHotelSlug(), {
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      rooms: 1,
    });
    expect(detail).not.toBeNull();
    expect(detail!.rooms.length).toBeGreaterThan(0);
    expect(detail!.rooms[0].pricePerNightCents).toBeGreaterThan(0);
  });

  it("checks availability and rejects invalid dates", async () => {
    const slug = await firstHotelSlug();
    const detail = await provider.getDetails(slug, { checkIn: CHECK_IN, checkOut: CHECK_OUT });
    const room = detail!.rooms[0];
    const avail = await provider.checkAvailability({
      hotelId: detail!.id,
      roomTypeId: room.id,
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      rooms: 1,
    });
    expect(avail.available).toBe(true);
    expect(avail.nights).toBe(3);

    await expect(
      provider.checkAvailability({
        hotelId: detail!.id,
        roomTypeId: room.id,
        checkIn: CHECK_OUT,
        checkOut: CHECK_IN, // inverted
        rooms: 1,
      }),
    ).rejects.toBeInstanceOf(ProviderError);
  });

  it("creates and cancels a provider booking", async () => {
    const slug = await firstHotelSlug();
    const detail = await provider.getDetails(slug, { checkIn: CHECK_IN, checkOut: CHECK_OUT });
    const room = detail!.rooms[0];
    const booking = await provider.createBooking({
      hotelId: detail!.id,
      roomTypeId: room.id,
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      rooms: 1,
      guests: 2,
      guest: { firstName: "Test", lastName: "Guest", email: "t@example.com" },
      idempotencyKey: "test-key-1",
    });
    expect(booking.providerBookingId).toMatch(/^mock_/);
    expect(booking.status).toBe("CONFIRMED");

    const cancel = await provider.cancelBooking(booking.providerBookingId);
    expect(cancel.cancelled).toBe(true);
  });
});

async function firstHotelSlug(): Promise<string> {
  const h = await db.hotel.findFirst({ orderBy: { name: "asc" } });
  return h!.slug;
}
