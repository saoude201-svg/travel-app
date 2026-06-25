import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Browse hand-picked destinations and find your next trip.",
};

const VIBE_LABELS: Record<string, string> = {
  BEACH: "Beach",
  CITY: "City",
  CULTURE: "Culture",
  ADVENTURE: "Adventure",
  RELAX: "Relax",
};

export default async function DestinationsPage() {
  const destinations = await db.destination.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { hotels: true } } },
  });

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">Destinations</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Twelve places worth the airfare. Pick one to see stays, or let the{" "}
          <Link href="/suggestions" className="font-medium text-primary hover:underline">
            AI planner
          </Link>{" "}
          suggest where to go.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d) => (
            <Link
              key={d.id}
              href={`/hotels?destination=${d.slug}`}
              className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[3/2] overflow-hidden">
                <Image
                  src={d.heroImage}
                  alt={d.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="font-serif text-xl font-semibold text-white">{d.name}</p>
                  <p className="text-sm text-white/80">{d.country}</p>
                </div>
              </div>
              <div className="space-y-3 p-5">
                <p className="line-clamp-2 text-sm text-muted-foreground">{d.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {d.vibes.map((v) => (
                    <Badge key={v} variant="secondary">{VIBE_LABELS[v] ?? v}</Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t pt-3 text-sm">
                  <span className="text-muted-foreground">{d._count.hotels} stays</span>
                  <span className="font-medium">from {formatCurrency(d.avgDailyBudgetCents)}/day</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
