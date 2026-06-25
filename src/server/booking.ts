import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { getHotelProvider, ProviderError } from "@/lib/providers/hotel";
import { computeStayPricing } from "@/lib/payments/pricing";
import { getStripe, isStripeConfigured } from "@/lib/payments/stripe";
import { nightsBetween, parseISODate } from "@/lib/utils";
import type { CreateBookingInput } from "@/lib/validations/booking";

export class BookingError extends Error {
  constructor(
    message: string,
    readonly code: "UNAVAILABLE" | "NOT_FOUND" | "INVALID" | "FORBIDDEN" | "POLICY",
  ) {
    super(message);
    this.name = "BookingError";
  }
}

/** Human-friendly confirmation code, e.g. WL-7QK2PD. */
function makeReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `WL-${s}`;
}

export interface CreateBookingResult {
  reference: string;
  bookingId: string;
  totalCents: number;
  currency: string;
  /** Present when Stripe is configured; drive Stripe Elements with this. */
  clientSecret: string | null;
  /** True when running without Stripe keys (simulated payment). */
  devMode: boolean;
}

/**
 * Create a PENDING booking with a server-authoritative price and a Stripe
 * PaymentIntent (or a dev placeholder). The client never supplies amounts.
 */
export async function createBooking(
  input: CreateBookingInput,
  userId: string,
): Promise<CreateBookingResult> {
  const ci = parseISODate(input.checkIn);
  const co = parseISODate(input.checkOut);
  if (!ci || !co || nightsBetween(ci, co) < 1) {
    throw new BookingError("Invalid stay dates", "INVALID");
  }
  const nights = nightsBetween(ci, co);

  // Load the room + hotel; verify they belong together.
  const room = await db.roomType.findUnique({
    where: { id: input.roomTypeId },
    include: { hotel: true },
  });
  if (!room || room.hotelId !== input.hotelId) {
    throw new BookingError("Room not found", "NOT_FOUND");
  }
  if (room.maxOccupancy * input.rooms < input.guests) {
    throw new BookingError("This room can't accommodate that many guests", "INVALID");
  }

  // Re-check availability with the provider (never trust the page).
  const provider = getHotelProvider();
  const availability = await provider.checkAvailability({
    hotelId: input.hotelId,
    roomTypeId: input.roomTypeId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    rooms: input.rooms,
  });
  if (!availability.available) {
    throw new BookingError("Those rooms are no longer available", "UNAVAILABLE");
  }

  // Recompute price from the authoritative nightly rate.
  const pricing = computeStayPricing({
    pricePerNightCents: availability.pricePerNightCents,
    nights,
    rooms: input.rooms,
  });

  const reference = makeReference();
  const idempotencyKey = randomUUID();

  // Reserve with the supplier (mock returns a provider id).
  let providerBookingId: string | null = null;
  try {
    const providerBooking = await provider.createBooking({
      hotelId: input.hotelId,
      roomTypeId: input.roomTypeId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      rooms: input.rooms,
      guests: input.guests,
      guest: {
        firstName: input.guestFirstName,
        lastName: input.guestLastName,
        email: input.guestEmail,
      },
      idempotencyKey,
    });
    providerBookingId = providerBooking.providerBookingId;
  } catch (e) {
    if (e instanceof ProviderError && e.code === "SOLD_OUT") {
      throw new BookingError("Those rooms are no longer available", "UNAVAILABLE");
    }
    throw e;
  }

  const booking = await db.booking.create({
    data: {
      reference,
      userId,
      hotelId: input.hotelId,
      roomTypeId: input.roomTypeId,
      status: "PENDING",
      checkIn: ci,
      checkOut: co,
      nights,
      rooms: input.rooms,
      guests: input.guests,
      roomSubtotalCents: pricing.roomSubtotalCents,
      taxesCents: pricing.taxesCents,
      feesCents: pricing.feesCents,
      totalCents: pricing.totalCents,
      currency: "USD",
      guestFirstName: input.guestFirstName,
      guestLastName: input.guestLastName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone || null,
      specialRequests: input.specialRequests || null,
      freeCancellation: availability.freeCancellation && room.refundable,
      cancellationDeadline: availability.cancellationDeadline
        ? new Date(availability.cancellationDeadline)
        : null,
      providerBookingId,
      payment: {
        create: {
          status: "REQUIRES_PAYMENT",
          amountCents: pricing.totalCents,
          currency: "USD",
          idempotencyKey,
        },
      },
    },
    include: { payment: true },
  });

  // --- Payment ---
  const stripe = getStripe();
  if (!stripe) {
    // DEV MODE: no Stripe keys. Payment is simulated client-side.
    return {
      reference,
      bookingId: booking.id,
      totalCents: pricing.totalCents,
      currency: "USD",
      clientSecret: null,
      devMode: true,
    };
  }

  const intent = await stripe.paymentIntents.create(
    {
      amount: pricing.totalCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { bookingId: booking.id, reference },
    },
    { idempotencyKey },
  );

  await db.payment.update({
    where: { bookingId: booking.id },
    data: {
      status: "PROCESSING",
      stripePaymentIntentId: intent.id,
      stripeClientSecret: intent.client_secret,
    },
  });

  return {
    reference,
    bookingId: booking.id,
    totalCents: pricing.totalCents,
    currency: "USD",
    clientSecret: intent.client_secret,
    devMode: false,
  };
}

/** Mark a booking CONFIRMED (used by the webhook, and by dev simulate). */
export async function confirmBookingByPaymentIntent(paymentIntentId: string) {
  const payment = await db.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    include: { booking: true },
  });
  if (!payment) return;
  if (payment.booking.status === "CONFIRMED") return; // idempotent

  await db.$transaction([
    db.payment.update({ where: { id: payment.id }, data: { status: "SUCCEEDED" } }),
    db.booking.update({ where: { id: payment.bookingId }, data: { status: "CONFIRMED" } }),
  ]);

  // Email stub — wire a real provider (Resend/SES) here.
  console.log(
    `📧 [email stub] Booking ${payment.booking.reference} confirmed for ${payment.booking.guestEmail}`,
  );
}

export async function failBookingByPaymentIntent(paymentIntentId: string, reason?: string) {
  const payment = await db.payment.findUnique({ where: { stripePaymentIntentId: paymentIntentId } });
  if (!payment) return;
  await db.$transaction([
    db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", lastError: reason ?? null } }),
    db.booking.update({ where: { id: payment.bookingId }, data: { status: "FAILED" } }),
  ]);
}

/** DEV MODE only: simulate a successful payment without Stripe. */
export async function devConfirmBooking(reference: string, userId: string) {
  if (isStripeConfigured()) {
    throw new BookingError("Dev confirmation is disabled when Stripe is configured", "FORBIDDEN");
  }
  const booking = await db.booking.findUnique({
    where: { reference },
    include: { payment: true },
  });
  if (!booking || booking.userId !== userId) throw new BookingError("Booking not found", "NOT_FOUND");
  if (booking.status === "CONFIRMED") return;

  await db.$transaction([
    db.payment.update({ where: { bookingId: booking.id }, data: { status: "SUCCEEDED" } }),
    db.booking.update({ where: { id: booking.id }, data: { status: "CONFIRMED" } }),
  ]);
  console.log(`📧 [email stub] Booking ${booking.reference} confirmed (dev mode).`);
}

/** Cancel a booking, respecting the stored free-cancellation deadline. */
export async function cancelBooking(reference: string, userId: string) {
  const booking = await db.booking.findUnique({
    where: { reference },
    include: { payment: true },
  });
  if (!booking || booking.userId !== userId) throw new BookingError("Booking not found", "NOT_FOUND");
  if (booking.status === "CANCELLED") return { refundCents: 0 };
  if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") {
    throw new BookingError("This booking can't be cancelled", "POLICY");
  }

  // Free cancellation if before the deadline (or no deadline set).
  const now = new Date();
  const freeWindow =
    booking.freeCancellation &&
    (!booking.cancellationDeadline || now < booking.cancellationDeadline);
  const refundCents = freeWindow ? booking.totalCents : 0;

  // Release supplier inventory.
  if (booking.providerBookingId) {
    try {
      await getHotelProvider().cancelBooking(booking.providerBookingId);
    } catch {
      /* supplier release is best-effort for the mock */
    }
  }

  // Refund via Stripe if a payment succeeded and a refund is due.
  const stripe = getStripe();
  if (
    stripe &&
    refundCents > 0 &&
    booking.payment?.stripePaymentIntentId &&
    booking.payment.status === "SUCCEEDED"
  ) {
    await stripe.refunds.create({ payment_intent: booking.payment.stripePaymentIntentId });
  }

  await db.$transaction([
    db.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED", cancelledAt: now },
    }),
    ...(booking.payment
      ? [
          db.payment.update({
            where: { bookingId: booking.id },
            data: { status: refundCents > 0 ? "REFUNDED" : booking.payment.status },
          }),
        ]
      : []),
  ]);

  return { refundCents };
}
