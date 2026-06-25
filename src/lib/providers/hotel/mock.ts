import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { nightsBetween, parseISODate } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";
import {
  type AvailabilityRequest,
  type AvailabilityResult,
  type CancelProviderBookingResult,
  type CreateProviderBookingInput,
  type HotelDetail,
  type HotelProvider,
  type HotelSearchParams,
  type HotelSearchResult,
  type HotelSummary,
  type ProviderBooking,
  type RoomTypeOffer,
  ProviderError,
} from "./types";

const DEFAULT_PAGE_SIZE = 12;
const FREE_CANCEL_WINDOW_DAYS = 2; // free cancellation up to N days before check-in

function requireDates(checkIn: string, checkOut: string) {
  const ci = parseISODate(checkIn);
  const co = parseISODate(checkOut);
  if (!ci || !co) throw new ProviderError("Invalid check-in/check-out dates", "INVALID_DATES");
  const nights = nightsBetween(ci, co);
  if (nights < 1) throw new ProviderError("Check-out must be after check-in", "INVALID_DATES");
  return { ci, co, nights };
}

function cancellationDeadline(checkIn: Date, freeCancellation: boolean): string | null {
  if (!freeCancellation) return null;
  const d = new Date(checkIn);
  d.setUTCDate(d.getUTCDate() - FREE_CANCEL_WINDOW_DAYS);
  return d.toISOString();
}

/** Rooms physically available for a room type over the requested window. */
async function roomsAvailableFor(
  roomTypeId: string,
  totalRooms: number,
  checkIn: Date,
  checkOut: Date,
): Promise<number> {
  // Count rooms held by overlapping non-cancelled bookings.
  const overlapping = await db.booking.aggregate({
    where: {
      roomTypeId,
      status: { in: ["PENDING", "CONFIRMED"] },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
    _sum: { rooms: true },
  });
  const held = overlapping._sum.rooms ?? 0;
  return Math.max(0, totalRooms - held);
}

export class MockHotelProvider implements HotelProvider {
  readonly name = "mock";

  async search(params: HotelSearchParams): Promise<HotelSearchResult> {
    const { nights } = requireDates(params.checkIn, params.checkOut);
    const rooms = Math.max(1, params.rooms);
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(48, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));
    const f = params.filters ?? {};

    const where: Prisma.HotelWhereInput = {};
    if (params.destinationSlug) {
      where.destination = { slug: params.destinationSlug };
    } else if (params.query) {
      where.OR = [
        { name: { contains: params.query, mode: "insensitive" } },
        { destination: { name: { contains: params.query, mode: "insensitive" } } },
        { destination: { country: { contains: params.query, mode: "insensitive" } } },
      ];
    }
    if (f.starRatings?.length) where.starRating = { in: f.starRatings };
    if (f.minGuestRating != null) where.guestRating = { gte: f.minGuestRating };
    if (f.freeCancellation) where.freeCancellation = true;
    if (f.amenities?.length) where.amenities = { hasEvery: f.amenities };
    if (f.priceMinCents != null || f.priceMaxCents != null) {
      where.basePriceCents = {
        ...(f.priceMinCents != null ? { gte: f.priceMinCents } : {}),
        ...(f.priceMaxCents != null ? { lte: f.priceMaxCents } : {}),
      };
    }

    const orderBy = ((): Prisma.HotelOrderByWithRelationInput[] => {
      switch (params.sort) {
        case "price_asc":
          return [{ basePriceCents: "asc" }];
        case "price_desc":
          return [{ basePriceCents: "desc" }];
        case "rating_desc":
          return [{ guestRating: "desc" }];
        default:
          return [{ guestRating: "desc" }, { starRating: "desc" }];
      }
    })();

    const [total, hotels, facetRows] = await Promise.all([
      db.hotel.count({ where }),
      db.hotel.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { destination: true },
      }),
      // Facets are computed over the destination/query scope, ignoring the
      // price/star/amenity filters so the controls show full bounds.
      db.hotel.findMany({
        where: params.destinationSlug
          ? { destination: { slug: params.destinationSlug } }
          : where.OR
            ? { OR: where.OR }
            : {},
        select: { basePriceCents: true, amenities: true },
      }),
    ]);

    const summaries: HotelSummary[] = hotels.map((h) => ({
      id: h.id,
      slug: h.slug,
      name: h.name,
      destination: {
        slug: h.destination.slug,
        name: h.destination.name,
        country: h.destination.country,
      },
      starRating: h.starRating,
      guestRating: h.guestRating,
      reviewCount: h.reviewCount,
      thumbnail: h.images[0] ?? "",
      amenities: h.amenities,
      freeCancellation: h.freeCancellation,
      nightlyFromCents: h.basePriceCents,
      stayTotalCents: h.basePriceCents * nights * rooms,
      latitude: h.latitude,
      longitude: h.longitude,
    }));

    const prices = facetRows.map((r) => r.basePriceCents);
    const amenitySet = new Set<string>();
    for (const r of facetRows) r.amenities.forEach((a) => amenitySet.add(a));

    return {
      hotels: summaries,
      total,
      page,
      pageSize,
      facets: {
        priceRange: {
          minCents: prices.length ? Math.min(...prices) : 0,
          maxCents: prices.length ? Math.max(...prices) : 0,
        },
        amenities: [...amenitySet].sort(),
      },
    };
  }

  async getDetails(
    idOrSlug: string,
    opts?: { checkIn?: string; checkOut?: string; rooms?: number },
  ): Promise<HotelDetail | null> {
    const hotel = await db.hotel.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        destination: true,
        roomTypes: { orderBy: { pricePerNightCents: "asc" } },
        reviews: { orderBy: { stayDate: "desc" }, take: 12 },
      },
    });
    if (!hotel) return null;

    const ci = parseISODate(opts?.checkIn ?? "");
    const co = parseISODate(opts?.checkOut ?? "");
    const rooms = Math.max(1, opts?.rooms ?? 1);

    const offers: RoomTypeOffer[] = await Promise.all(
      hotel.roomTypes.map(async (rt) => {
        const roomsAvailable =
          ci && co ? await roomsAvailableFor(rt.id, rt.totalRooms, ci, co) : rt.totalRooms;
        return {
          id: rt.id,
          name: rt.name,
          description: rt.description,
          bedConfig: rt.bedConfig,
          maxOccupancy: rt.maxOccupancy,
          sizeSqm: rt.sizeSqm,
          amenities: rt.amenities,
          images: rt.images,
          refundable: rt.refundable,
          pricePerNightCents: rt.pricePerNightCents,
          roomsAvailable: Math.max(0, roomsAvailable - (rooms - 1)),
        };
      }),
    );

    return {
      id: hotel.id,
      slug: hotel.slug,
      name: hotel.name,
      destination: {
        slug: hotel.destination.slug,
        name: hotel.destination.name,
        country: hotel.destination.country,
      },
      description: hotel.description,
      address: hotel.address,
      starRating: hotel.starRating,
      guestRating: hotel.guestRating,
      reviewCount: hotel.reviewCount,
      images: hotel.images,
      amenities: hotel.amenities,
      freeCancellation: hotel.freeCancellation,
      nightlyFromCents: hotel.basePriceCents,
      stayTotalCents: hotel.basePriceCents,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      rooms: offers,
      reviews: hotel.reviews.map((r) => ({
        id: r.id,
        author: r.author,
        rating: r.rating,
        title: r.title,
        body: r.body,
        stayDate: r.stayDate.toISOString(),
      })),
    };
  }

  async checkAvailability(req: AvailabilityRequest): Promise<AvailabilityResult> {
    const { ci, co, nights } = requireDates(req.checkIn, req.checkOut);
    const room = await db.roomType.findUnique({
      where: { id: req.roomTypeId },
      include: { hotel: true },
    });
    if (!room || room.hotelId !== req.hotelId) {
      throw new ProviderError("Room type not found", "NOT_FOUND");
    }
    const roomsAvailable = await roomsAvailableFor(room.id, room.totalRooms, ci, co);
    const available = roomsAvailable >= req.rooms;
    return {
      available,
      roomsAvailable,
      pricePerNightCents: room.pricePerNightCents,
      nights,
      refundable: room.refundable,
      freeCancellation: room.hotel.freeCancellation,
      cancellationDeadline: cancellationDeadline(ci, room.hotel.freeCancellation),
    };
  }

  async createBooking(input: CreateProviderBookingInput): Promise<ProviderBooking> {
    // Supplier-side reservation. For the mock we re-check availability and
    // mint a provider reference; the durable Booking row is the server's job.
    const { ci } = requireDates(input.checkIn, input.checkOut);
    const availability = await this.checkAvailability({
      hotelId: input.hotelId,
      roomTypeId: input.roomTypeId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      rooms: input.rooms,
    });
    if (!availability.available) {
      throw new ProviderError("Rooms are no longer available", "SOLD_OUT");
    }
    return {
      providerBookingId: `mock_${randomUUID()}`,
      status: "CONFIRMED",
      cancellationDeadline: availability.cancellationDeadline,
    };
  }

  async cancelBooking(providerBookingId: string): Promise<CancelProviderBookingResult> {
    if (!providerBookingId.startsWith("mock_")) {
      throw new ProviderError("Unknown provider booking", "NOT_FOUND");
    }
    // Refund policy is applied by the server using the stored deadline; the
    // supplier simply confirms the release here.
    return { cancelled: true, refundCents: 0 };
  }
}
