/**
 * Provider-agnostic hotel domain types and the `HotelProvider` contract.
 *
 * Everything the rest of the app touches goes through these DTOs, so the
 * underlying inventory source (mock seed data today, a real partner API
 * tomorrow) can be swapped without changing callers. Prices are always in
 * integer minor units (cents) to avoid floating-point drift.
 */

export type Vibe = "BEACH" | "CITY" | "CULTURE" | "ADVENTURE" | "RELAX";

export type HotelSortKey =
  | "recommended"
  | "price_asc"
  | "price_desc"
  | "rating_desc";

export interface SearchFilters {
  priceMinCents?: number;
  priceMaxCents?: number;
  starRatings?: number[]; // e.g. [4, 5]
  minGuestRating?: number; // 0-10
  amenities?: string[]; // must include all
  freeCancellation?: boolean;
}

export interface HotelSearchParams {
  /** Destination slug (preferred) or free-text query. */
  destinationSlug?: string;
  query?: string;
  checkIn: string; // yyyy-mm-dd
  checkOut: string; // yyyy-mm-dd
  guests: number;
  rooms: number;
  filters?: SearchFilters;
  sort?: HotelSortKey;
  page?: number; // 1-based
  pageSize?: number;
}

export interface HotelSummary {
  id: string;
  slug: string;
  name: string;
  destination: { slug: string; name: string; country: string };
  starRating: number;
  guestRating: number;
  reviewCount: number;
  thumbnail: string;
  amenities: string[];
  freeCancellation: boolean;
  /** Lowest nightly rate matching the search, in cents. */
  nightlyFromCents: number;
  /** Total for the whole stay (room only, pre-tax), in cents. */
  stayTotalCents: number;
  latitude: number;
  longitude: number;
}

export interface SearchFacets {
  /** Price range present in the unfiltered result set, for slider bounds. */
  priceRange: { minCents: number; maxCents: number };
  amenities: string[];
}

export interface HotelSearchResult {
  hotels: HotelSummary[];
  total: number;
  page: number;
  pageSize: number;
  facets: SearchFacets;
}

export interface RoomTypeOffer {
  id: string;
  name: string;
  description: string;
  bedConfig: string;
  maxOccupancy: number;
  sizeSqm: number | null;
  amenities: string[];
  images: string[];
  refundable: boolean;
  pricePerNightCents: number;
  /** Rooms left for the requested dates. */
  roomsAvailable: number;
}

export interface HotelReview {
  id: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  stayDate: string;
}

export interface HotelDetail extends Omit<HotelSummary, "thumbnail"> {
  description: string;
  address: string;
  images: string[];
  rooms: RoomTypeOffer[];
  reviews: HotelReview[];
}

export interface AvailabilityRequest {
  hotelId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
}

export interface AvailabilityResult {
  available: boolean;
  roomsAvailable: number;
  pricePerNightCents: number;
  nights: number;
  refundable: boolean;
  freeCancellation: boolean;
  /** ISO timestamp after which cancellation is no longer free, if any. */
  cancellationDeadline: string | null;
}

export interface CreateProviderBookingInput {
  hotelId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  guests: number;
  guest: { firstName: string; lastName: string; email: string };
  /** Idempotency key so retries don't double-book with the supplier. */
  idempotencyKey: string;
}

export interface ProviderBooking {
  providerBookingId: string;
  status: "CONFIRMED" | "PENDING" | "FAILED";
  cancellationDeadline: string | null;
}

export interface CancelProviderBookingResult {
  cancelled: boolean;
  refundCents: number;
}

/**
 * The contract every inventory source implements. Methods may reject with a
 * {@link ProviderError} for predictable failure cases (sold out, unknown id).
 */
export interface HotelProvider {
  readonly name: string;
  search(params: HotelSearchParams): Promise<HotelSearchResult>;
  getDetails(idOrSlug: string, opts?: { checkIn?: string; checkOut?: string; rooms?: number }): Promise<HotelDetail | null>;
  checkAvailability(req: AvailabilityRequest): Promise<AvailabilityResult>;
  createBooking(input: CreateProviderBookingInput): Promise<ProviderBooking>;
  cancelBooking(providerBookingId: string): Promise<CancelProviderBookingResult>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly code:
      | "NOT_FOUND"
      | "SOLD_OUT"
      | "INVALID_DATES"
      | "UNAVAILABLE"
      | "NOT_IMPLEMENTED",
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
