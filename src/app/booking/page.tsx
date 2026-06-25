import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getHotelProvider } from "@/lib/providers/hotel";
import { bookingContextSchema } from "@/lib/validations/booking";
import { computeStayPricing } from "@/lib/payments/pricing";
import { getPublishableKey } from "@/lib/payments/stripe";
import { nightsBetween, parseISODate } from "@/lib/utils";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { BookingFlow } from "@/components/booking/booking-flow";
import { PriceSummary } from "@/components/booking/price-summary";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Complete your booking" };

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const user = await requireUser(`/booking?${new URLSearchParams(raw as Record<string, string>).toString()}`);

  const parsed = bookingContextSchema.safeParse(raw);
  if (!parsed.success) return <BookingError message="This booking link is incomplete or invalid." />;
  const ctx = parsed.data;

  const room = await db.roomType.findUnique({
    where: { id: ctx.roomTypeId },
    include: { hotel: true },
  });
  if (!room || room.hotelId !== ctx.hotelId) {
    return <BookingError message="We couldn't find that room." />;
  }

  let availability;
  try {
    availability = await getHotelProvider().checkAvailability({
      hotelId: ctx.hotelId,
      roomTypeId: ctx.roomTypeId,
      checkIn: ctx.checkIn,
      checkOut: ctx.checkOut,
      rooms: ctx.rooms,
    });
  } catch {
    return <BookingError message="Those dates don't look valid. Please start a new search." />;
  }
  if (!availability.available) {
    return <BookingError message="Those rooms are no longer available for your dates." />;
  }

  const ci = parseISODate(ctx.checkIn)!;
  const co = parseISODate(ctx.checkOut)!;
  const nights = nightsBetween(ci, co);
  const pricing = computeStayPricing({
    pricePerNightCents: availability.pricePerNightCents,
    nights,
    rooms: ctx.rooms,
  });

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <h1 className="mb-8 font-serif text-3xl font-semibold tracking-tight">Complete your booking</h1>
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
          <BookingFlow
            context={ctx}
            totalCents={pricing.totalCents}
            publishableKey={getPublishableKey()}
            defaultEmail={user.email}
            defaultName={user.name}
          />
          <div className="lg:sticky lg:top-20">
            <PriceSummary
              hotelName={room.hotel.name}
              roomName={room.name}
              image={room.hotel.images[0] ?? room.images[0] ?? ""}
              checkIn={ci}
              checkOut={co}
              nights={nights}
              rooms={ctx.rooms}
              guests={ctx.guests}
              roomSubtotalCents={pricing.roomSubtotalCents}
              taxesCents={pricing.taxesCents}
              feesCents={pricing.feesCents}
              totalCents={pricing.totalCents}
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function BookingError({ message }: { message: string }) {
  return (
    <>
      <SiteHeader />
      <main className="container-page flex min-h-[60vh] flex-col items-center justify-center py-10 text-center">
        <AlertCircle className="size-10 text-destructive" aria-hidden />
        <h1 className="mt-4 text-xl font-semibold">We hit a snag</h1>
        <p className="mt-1 max-w-sm text-muted-foreground">{message}</p>
        <Button asChild className="mt-6">
          <Link href="/hotels">Back to hotel search</Link>
        </Button>
      </main>
      <SiteFooter />
    </>
  );
}
