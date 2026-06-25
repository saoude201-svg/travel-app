import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

/** Booking context carried via query params from the hotel detail page. */
export const bookingContextSchema = z.object({
  hotelId: z.string().min(1),
  roomTypeId: z.string().min(1),
  checkIn: isoDate,
  checkOut: isoDate,
  guests: z.coerce.number().int().min(1).max(16),
  rooms: z.coerce.number().int().min(1).max(8),
});

export type BookingContext = z.infer<typeof bookingContextSchema>;

export const guestDetailsSchema = z.object({
  guestFirstName: z.string().min(1, "First name is required").max(60),
  guestLastName: z.string().min(1, "Last name is required").max(60),
  guestEmail: z.string().email("Enter a valid email"),
  guestPhone: z.string().max(40).optional().or(z.literal("")),
  specialRequests: z.string().max(500).optional().or(z.literal("")),
});

export const createBookingSchema = bookingContextSchema.merge(guestDetailsSchema);

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
