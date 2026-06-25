import Link from "next/link";
import Image from "next/image";
import { Sparkles, Search, CreditCard, ArrowRight, Star } from "lucide-react";
import { db } from "@/lib/db";
import { brand } from "@/design/tokens";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { formatCurrency } from "@/lib/utils";

export default async function HomePage() {
  const destinations = await db.destination.findMany({
    take: 6,
    orderBy: { name: "asc" },
    include: { _count: { select: { hotels: true } } },
  });

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <Image
              src="https://picsum.photos/seed/wanderlust-hero/1920/1080"
              alt=""
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
          </div>
          <div className="container-page flex min-h-[72vh] flex-col justify-center py-24">
            <Badge variant="accent" className="mb-5 w-fit gap-1.5">
              <Sparkles className="size-3.5" aria-hidden /> AI-crafted trips
            </Badge>
            <h1 className="max-w-3xl text-balance font-serif text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              {brand.tagline}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Tell us your budget, dates, and the kind of trip you crave.
              We&apos;ll suggest destinations worth the airfare — then help you
              book the perfect stay.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/suggestions">
                  Plan my trip <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/hotels">Browse hotels</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="container-page py-20">
          <h2 className="font-serif text-3xl font-semibold tracking-tight">
            Three steps to takeoff
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: "Describe your trip",
                body: "Budget, dates, vibe, who's coming. Our AI planner turns it into a shortlist of destinations with itineraries and budgets.",
              },
              {
                icon: Search,
                title: "Search great stays",
                body: "Jump straight into hotel search for any destination. Filter by price, rating, amenities, and free cancellation.",
              },
              {
                icon: CreditCard,
                title: "Book with confidence",
                body: "Secure checkout, instant confirmation, and a tidy dashboard for every upcoming and past trip.",
              },
            ].map((step) => (
              <div key={step.title} className="rounded-xl border bg-card p-6">
                <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured destinations */}
        <section className="container-page pb-24">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl font-semibold tracking-tight">
              Destinations to dream about
            </h2>
            <Button asChild variant="link" className="hidden sm:inline-flex">
              <Link href="/destinations">
                View all <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((d) => (
              <Link
                key={d.id}
                href={`/hotels?destination=${d.slug}`}
                className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={d.heroImage}
                    alt={d.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{d.name}</h3>
                    <span className="text-sm text-muted-foreground">{d.country}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {d.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Star className="size-3.5 fill-accent text-accent" aria-hidden />
                      {d._count.hotels} stays
                    </span>
                    <span className="font-medium text-foreground">
                      from {formatCurrency(d.avgDailyBudgetCents)}/day
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
