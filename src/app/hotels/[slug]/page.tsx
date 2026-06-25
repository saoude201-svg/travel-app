import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Check, BedDouble, Users, Maximize, CalendarCheck2, Ban } from "lucide-react";
import { getHotelProvider } from "@/lib/providers/hotel";
import { parseSearchParams, searchParamsToQuery, type RawSearchParams } from "@/lib/validations/search";
import { computeStayPricing } from "@/lib/payments/pricing";
import { formatCurrency, formatDateRange, nightsBetween, parseISODate } from "@/lib/utils";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Gallery } from "@/components/hotels/gallery";
import { HotelMap } from "@/components/hotels/hotel-map";
import { Stars, GuestRating } from "@/components/hotels/stars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getHotelProvider().getDetails(slug);
  if (!detail) return { title: "Hotel not found" };
  return {
    title: detail.name,
    description: detail.description.slice(0, 160),
    openGraph: { images: detail.images.slice(0, 1) },
  };
}

export default async function HotelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { slug } = await params;
  const raw = await searchParams;
  const search = parseSearchParams(raw);

  const detail = await getHotelProvider().getDetails(slug, {
    checkIn: search.checkIn,
    checkOut: search.checkOut,
    rooms: search.rooms,
  });
  if (!detail) notFound();

  const ci = parseISODate(search.checkIn)!;
  const co = parseISODate(search.checkOut)!;
  const nights = nightsBetween(ci, co);
  const stayQuery = searchParamsToQuery({ ...search, page: 1 });

  return (
    <>
      <SiteHeader />
      <main className="container-page py-8">
        <nav className="mb-4 text-sm text-muted-foreground">
          <Link href={`/hotels?destination=${detail.destination.slug}&${stayQuery}`} className="hover:text-foreground">
            ← Back to {detail.destination.name}
          </Link>
        </nav>

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Stars rating={detail.starRating} />
            <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">{detail.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" aria-hidden /> {detail.address}
            </p>
          </div>
          <GuestRating rating={detail.guestRating} count={detail.reviewCount} />
        </div>

        <Gallery images={detail.images} alt={detail.name} />

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-8">
            <section aria-labelledby="about">
              <h2 id="about" className="text-xl font-semibold">About this stay</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{detail.description}</p>
            </section>

            <section aria-labelledby="amenities">
              <h2 id="amenities" className="text-xl font-semibold">Amenities</h2>
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {detail.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 text-primary" aria-hidden /> {a}
                  </li>
                ))}
              </ul>
            </section>

            <Separator />

            {/* Rooms */}
            <section aria-labelledby="rooms">
              <h2 id="rooms" className="text-xl font-semibold">Choose your room</h2>
              <p className="text-sm text-muted-foreground">
                {formatDateRange(ci, co)} · {nights} night{nights === 1 ? "" : "s"} ·{" "}
                {search.rooms} room{search.rooms === 1 ? "" : "s"}
              </p>
              <div className="mt-4 space-y-4">
                {detail.rooms.map((room) => {
                  const pricing = computeStayPricing({
                    pricePerNightCents: room.pricePerNightCents,
                    nights,
                    rooms: search.rooms,
                  });
                  const soldOut = room.roomsAvailable < search.rooms;
                  const bookingQuery = new URLSearchParams({
                    hotelId: detail.id,
                    roomTypeId: room.id,
                    checkIn: search.checkIn,
                    checkOut: search.checkOut,
                    guests: String(search.guests),
                    rooms: String(search.rooms),
                  }).toString();

                  return (
                    <Card key={room.id}>
                      <CardContent className="grid gap-4 p-5 sm:grid-cols-[1fr_auto]">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{room.name}</h3>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BedDouble className="size-4" aria-hidden /> {room.bedConfig}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="size-4" aria-hidden /> Sleeps {room.maxOccupancy}
                            </span>
                            {room.sizeSqm ? (
                              <span className="flex items-center gap-1">
                                <Maximize className="size-4" aria-hidden /> {room.sizeSqm} m²
                              </span>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {room.refundable ? (
                              <Badge variant="success" className="gap-1">
                                <CalendarCheck2 className="size-3" aria-hidden /> Free cancellation
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <Ban className="size-3" aria-hidden /> Non-refundable
                              </Badge>
                            )}
                            {room.amenities.slice(0, 3).map((a) => (
                              <Badge key={a} variant="secondary">{a}</Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between gap-2 border-t pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                          <div className="text-right">
                            <p className="text-xl font-semibold">{formatCurrency(pricing.totalCents)}</p>
                            <p className="text-xs text-muted-foreground">
                              total · {formatCurrency(room.pricePerNightCents)}/night
                            </p>
                          </div>
                          {soldOut ? (
                            <Button disabled variant="secondary">Sold out</Button>
                          ) : (
                            <div className="text-right">
                              {room.roomsAvailable <= 3 ? (
                                <p className="mb-1 text-xs font-medium text-destructive">
                                  Only {room.roomsAvailable} left
                                </p>
                              ) : null}
                              <Button asChild>
                                <Link href={`/booking?${bookingQuery}`}>Reserve</Link>
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            <Separator />

            {/* Reviews */}
            <section aria-labelledby="reviews">
              <h2 id="reviews" className="text-xl font-semibold">Guest reviews</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {detail.reviews.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="space-y-2 p-5">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{r.title}</p>
                        <Badge variant="default">{r.rating.toFixed(1)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.body}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.author} · {new Date(r.stayDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
            <Card>
              <CardContent className="space-y-3 p-5">
                <p className="text-sm text-muted-foreground">From</p>
                <p className="text-3xl font-semibold">{formatCurrency(detail.nightlyFromCents)}</p>
                <p className="text-sm text-muted-foreground">per night, before taxes & fees</p>
                <Button asChild className="w-full">
                  <a href="#rooms">See room options</a>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  {detail.freeCancellation
                    ? "Free cancellation on most rooms"
                    : "Cancellation policies vary by room"}
                </p>
              </CardContent>
            </Card>
            <HotelMap points={[{ lat: detail.latitude, lng: detail.longitude, name: detail.name }]} />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
