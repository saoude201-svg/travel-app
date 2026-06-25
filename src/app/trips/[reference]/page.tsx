import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, MapPin, Mail, CalendarRange, BedDouble, Users } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { formatCurrency, formatDateRange } from "@/lib/utils";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking/booking-status";
import { CancelButton } from "@/components/booking/cancel-button";

export const metadata: Metadata = { title: "Booking details" };

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ confirmed?: string }>;
}) {
  const { reference } = await params;
  const { confirmed } = await searchParams;
  const user = await requireUser(`/trips/${reference}`);

  const booking = await db.booking.findUnique({
    where: { reference },
    include: { hotel: { include: { destination: true } }, roomType: true, payment: true },
  });
  if (!booking || booking.userId !== user.id) notFound();

  const deadlineLabel = booking.cancellationDeadline
    ? booking.cancellationDeadline.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;
  const canCancel = booking.status === "CONFIRMED" || booking.status === "PENDING";

  return (
    <>
      <SiteHeader />
      <main className="container-page max-w-3xl py-10">
        {confirmed && booking.status === "CONFIRMED" ? (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
            <CheckCircle2 className="size-6 text-success" aria-hidden />
            <div>
              <p className="font-semibold">You&apos;re booked!</p>
              <p className="text-sm text-muted-foreground">
                A confirmation has been sent to {booking.guestEmail}.
              </p>
            </div>
          </div>
        ) : null}

        {confirmed && booking.status === "PENDING" ? (
          <div className="mb-6 flex items-center gap-3 rounded-xl border bg-secondary/40 p-4">
            <Clock className="size-6 text-muted-foreground" aria-hidden />
            <div>
              <p className="font-semibold">Finalizing your payment…</p>
              <p className="text-sm text-muted-foreground">
                This usually takes a few seconds.{" "}
                <Link href={`/trips/${reference}`} className="font-medium text-primary hover:underline">
                  Refresh
                </Link>
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Confirmation</p>
            <h1 className="font-mono text-2xl font-semibold">{booking.reference}</h1>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>

        <Card className="mt-6 overflow-hidden">
          <div className="relative aspect-[21/9]">
            <Image src={booking.hotel.images[0] ?? ""} alt="" fill sizes="100vw" className="object-cover" />
          </div>
          <CardContent className="space-y-4 p-6">
            <div>
              <h2 className="text-xl font-semibold">{booking.hotel.name}</h2>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4" aria-hidden /> {booking.hotel.destination.name},{" "}
                {booking.hotel.destination.country}
              </p>
            </div>

            <Separator />

            <dl className="grid gap-3 sm:grid-cols-2">
              <Detail icon={CalendarRange} label="Dates">
                {formatDateRange(booking.checkIn, booking.checkOut)} · {booking.nights} night
                {booking.nights === 1 ? "" : "s"}
              </Detail>
              <Detail icon={BedDouble} label="Room">
                {booking.roomType.name} · {booking.rooms} room{booking.rooms === 1 ? "" : "s"}
              </Detail>
              <Detail icon={Users} label="Guests">
                {booking.guests} guest{booking.guests === 1 ? "" : "s"}
              </Detail>
              <Detail icon={Mail} label="Lead guest">
                {booking.guestFirstName} {booking.guestLastName}
              </Detail>
            </dl>

            {booking.specialRequests ? (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Requests:</span> {booking.specialRequests}
              </p>
            ) : null}

            <Separator />

            <dl className="space-y-1.5 text-sm">
              <Row label={`Room (${booking.nights} × ${booking.rooms})`} value={booking.roomSubtotalCents} />
              <Row label="Taxes" value={booking.taxesCents} />
              <Row label="Service fee" value={booking.feesCents} />
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-semibold">
                <dt>Total {booking.status === "CANCELLED" ? "(cancelled)" : "paid"}</dt>
                <dd>{formatCurrency(booking.totalCents)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <Button asChild variant="outline">
            <Link href="/trips">← All trips</Link>
          </Button>
          {canCancel ? (
            <CancelButton
              reference={booking.reference}
              freeUntilLabel={deadlineLabel}
              refundable={booking.freeCancellation}
            />
          ) : booking.status === "CANCELLED" && booking.cancelledAt ? (
            <p className="text-sm text-muted-foreground">
              Cancelled on{" "}
              {booking.cancelledAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium">{children}</dd>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{formatCurrency(value)}</dd>
    </div>
  );
}
