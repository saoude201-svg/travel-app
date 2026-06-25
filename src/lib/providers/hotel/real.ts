import {
  type AvailabilityRequest,
  type AvailabilityResult,
  type CancelProviderBookingResult,
  type CreateProviderBookingInput,
  type HotelDetail,
  type HotelProvider,
  type HotelSearchParams,
  type HotelSearchResult,
  type ProviderBooking,
  ProviderError,
} from "./types";

/**
 * RealHotelProvider — skeleton for a live partner API.
 *
 * RECOMMENDED FIRST INTEGRATION: Amadeus Self-Service (instant free sandbox,
 * no partner approval or deposit to start). Each TODO marks exactly where the
 * HTTP calls go. Map the partner's response shape into the provider-agnostic
 * DTOs in ./types so nothing downstream has to change.
 *
 * Auth (Amadeus): POST {AMADEUS_BASE_URL}/v1/security/oauth2/token with
 * client_credentials to get a bearer token; cache it until expiry.
 *
 * Other candidates and what each needs:
 *  - Hotelbeds APItude: partner approval, sandbox available, no upfront deposit.
 *  - Expedia Rapid: partner approval, heavier onboarding.
 *  - Booking.com Demand API: partner approval, contractual.
 */
export class RealHotelProvider implements HotelProvider {
  readonly name = "real";

  private readonly baseUrl = process.env.AMADEUS_BASE_URL ?? "https://test.api.amadeus.com";
  private readonly clientId = process.env.AMADEUS_CLIENT_ID;
  private readonly clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  private assertConfigured() {
    if (!this.clientId || !this.clientSecret) {
      throw new ProviderError(
        "RealHotelProvider is not configured. Set AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET, or use HOTEL_PROVIDER=mock.",
        "NOT_IMPLEMENTED",
      );
    }
  }

  // private async getAccessToken(): Promise<string> {
  //   // TODO: POST `${this.baseUrl}/v1/security/oauth2/token`
  //   //   body: grant_type=client_credentials&client_id=...&client_secret=...
  //   //   cache token in memory keyed by expiry.
  // }

  async search(_params: HotelSearchParams): Promise<HotelSearchResult> {
    this.assertConfigured();
    // TODO:
    //  1. Resolve destination -> city/geocode (Amadeus reference data).
    //  2. GET `${baseUrl}/v3/shopping/hotel-offers` with cityCode, checkInDate,
    //     checkOutDate, adults, roomQuantity, priceRange, ratings...
    //  3. Map each offer to HotelSummary (prices -> cents).
    //  4. Apply paging/sort the partner doesn't support client-side.
    throw new ProviderError("RealHotelProvider.search not implemented", "NOT_IMPLEMENTED");
  }

  async getDetails(
    _idOrSlug: string,
    _opts?: { checkIn?: string; checkOut?: string; rooms?: number },
  ): Promise<HotelDetail | null> {
    this.assertConfigured();
    // TODO: GET `${baseUrl}/v3/shopping/hotel-offers/{hotelId}` (+ ratings,
    //       sentiments endpoints for reviews). Map to HotelDetail.
    throw new ProviderError("RealHotelProvider.getDetails not implemented", "NOT_IMPLEMENTED");
  }

  async checkAvailability(_req: AvailabilityRequest): Promise<AvailabilityResult> {
    this.assertConfigured();
    // TODO: GET `${baseUrl}/v3/shopping/hotel-offers/{offerId}` to re-price and
    //       confirm the specific offer is still bookable.
    throw new ProviderError("RealHotelProvider.checkAvailability not implemented", "NOT_IMPLEMENTED");
  }

  async createBooking(_input: CreateProviderBookingInput): Promise<ProviderBooking> {
    this.assertConfigured();
    // TODO: POST `${baseUrl}/v2/booking/hotel-orders` with the priced offerId,
    //       guests and payment/guarantee. Send `idempotencyKey` as the
    //       partner's idempotency header. Map confirmation -> ProviderBooking.
    throw new ProviderError("RealHotelProvider.createBooking not implemented", "NOT_IMPLEMENTED");
  }

  async cancelBooking(_providerBookingId: string): Promise<CancelProviderBookingResult> {
    this.assertConfigured();
    // TODO: DELETE/POST the partner's cancellation endpoint; return the
    //       supplier-confirmed refund amount in cents.
    throw new ProviderError("RealHotelProvider.cancelBooking not implemented", "NOT_IMPLEMENTED");
  }
}
