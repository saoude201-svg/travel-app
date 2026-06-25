import Link from "next/link";
import Image from "next/image";
import { MapPin, Check } from "lucide-react";
import type { HotelSummary } from "@/lib/providers/hotel/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stars, GuestRating } from "@/components/hotels/stars";
import { formatCurrency, nightsBetween, parseISODate } from "@/lib/utils";

export function HotelCard({
  hotel,
  query,
  checkIn,
  checkOut,
  rooms,
}: {
  hotel: HotelSummary;
  query: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
}) {
  const ci = parseISODate(checkIn);
  const co = parseISODate(checkOut);
  const nights = ci && co ? nightsBetween(ci, co) : 1;
  const href = `/hotels/${hotel.slug}?${query}`;

  return (
    <article className="group grid gap-0 overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md sm:grid-cols-[16rem_1fr]">
      <Link href={href} className="relative aspect-[4/3] sm:aspect-auto" tabIndex={-1} aria-hidden>
        <Image
          src={hotel.thumbnail}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 16rem"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Stars rating={hotel.starRating} />
            <h3 className="mt-1 text-lg font-semibold leading-tight">
              <Link href={href} className="hover:underline">
                {hotel.name}
              </Link>
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden />
              {hotel.destination.name}, {hotel.destination.country}
            </p>
          </div>
          <GuestRating rating={hotel.guestRating} count={hotel.reviewCount} />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {hotel.freeCancellation ? (
            <Badge variant="success" className="gap-1">
              <Check className="size-3" aria-hidden /> Free cancellation
            </Badge>
          ) : null}
          {hotel.amenities.slice(0, 3).map((a) => (
            <Badge key={a} variant="secondary">
              {a}
            </Badge>
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 pt-2">
          <p className="text-xs text-muted-foreground">
            {nights} night{nights === 1 ? "" : "s"}
            {rooms > 1 ? ` · ${rooms} rooms` : ""}, incl. taxes & fees at checkout
          </p>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">from</p>
            <p className="text-xl font-semibold">{formatCurrency(hotel.nightlyFromCents)}</p>
            <p className="text-xs text-muted-foreground">per night</p>
          </div>
        </div>

        <Button asChild className="w-full sm:w-auto sm:self-end">
          <Link href={href}>View rooms</Link>
        </Button>
      </div>
    </article>
  );
}
