import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Luggage, MapPin, CalendarRange, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { formatCurrency, formatDateRange } from "@/lib/utils";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/booking/booking-status";

export const metadata: Metadata = { title: "My trips" };

type BookingWithHotel = Awaited<ReturnType<typeof loadBookings>>[number];

async function loadBookings(userId: string) {
  return db.booking.findMany({
    where: { userId },
    orderBy: { checkIn: "desc" },
    include: { hotel: { include: { destination: true } }, roomType: true },
  });
}

export default async function TripsPage() {
  const user = await requireUser("/trips");
  const bookings = await loadBookings(user.id);

  const now = new Date();
  const upcoming = bookings
    .filter((b) => (b.status === "CONFIRMED" || b.status === "PENDING") && b.checkOut >= now)
    .sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime());
  const past = bookings.filter((b) => !upcoming.includes(b));

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">My trips</h1>
            <p className="mt-1 text-muted-foreground">Your upcoming and past bookings.</p>
          </div>
          <Button asChild>
            <Link href="/suggestions">Plan a new trip</Link>
          </Button>
        </div>

        {bookings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-8 space-y-10">
            <Section title="Upcoming" count={upcoming.length}>
              {upcoming.length ? (
                upcoming.map((b) => <BookingRow key={b.id} booking={b} />)
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming trips. Time to plan one!</p>
              )}
            </Section>

            {past.length ? (
              <Section title="Past & cancelled" count={past.length}>
                {past.map((b) => <BookingRow key={b.id} booking={b} muted />)}
              </Section>
            ) : null}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">
        {title} <span className="text-muted-foreground">({count})</span>
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function BookingRow({ booking: b, muted }: { booking: BookingWithHotel; muted?: boolean }) {
  return (
    <Card className={muted ? "opacity-80" : undefined}>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <Link href={`/trips/${b.reference}`} className="relative size-20 shrink-0 overflow-hidden rounded-lg" aria-hidden tabIndex={-1}>
          <Image src={b.hotel.images[0] ?? ""} alt="" fill sizes="80px" className="object-cover" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">
              <Link href={`/trips/${b.reference}`} className="hover:underline">{b.hotel.name}</Link>
            </h3>
            <BookingStatusBadge status={b.status} />
          </div>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden /> {b.hotel.destination.name}, {b.hotel.destination.country}
          </p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <CalendarRange className="size-3.5" aria-hidden /> {formatDateRange(b.checkIn, b.checkOut)} · {b.roomType.name}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
          <p className="font-semibold">{formatCurrency(b.totalCents)}</p>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/trips/${b.reference}`}>
              Details <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
      <Luggage className="size-10 text-muted-foreground" aria-hidden />
      <h2 className="mt-4 text-lg font-semibold">No trips yet</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        When you book a stay, it&apos;ll show up here with all the details.
      </p>
      <div className="mt-6 flex gap-2">
        <Button asChild><Link href="/suggestions">Plan a trip</Link></Button>
        <Button asChild variant="outline"><Link href="/hotels">Browse hotels</Link></Button>
      </div>
    </div>
  );
}
