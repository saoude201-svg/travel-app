import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { db } from "@/lib/db";
import { getHotelProvider } from "@/lib/providers/hotel";
import {
  parseSearchParams,
  searchParamsToQuery,
  type RawSearchParams,
} from "@/lib/validations/search";
import { formatDateRange, parseISODate } from "@/lib/utils";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { SearchBar } from "@/components/hotels/search-bar";
import { FiltersPanel } from "@/components/hotels/filters-panel";
import { SortSelect } from "@/components/hotels/sort-select";
import { HotelCard } from "@/components/hotels/hotel-card";
import { Pagination } from "@/components/hotels/pagination";
import { ResultsView } from "@/components/hotels/results-view";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}): Promise<Metadata> {
  const raw = await searchParams;
  const slug = typeof raw.destination === "string" ? raw.destination : undefined;
  if (slug) {
    const d = await db.destination.findUnique({ where: { slug } });
    if (d) {
      return {
        title: `Hotels in ${d.name}`,
        description: `Find and book hotels in ${d.name}, ${d.country}. ${d.description}`,
      };
    }
  }
  return { title: "Hotel search" };
}

export default async function HotelsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const raw = await searchParams;
  const params = parseSearchParams(raw);

  const [destinations, result, activeDestination] = await Promise.all([
    db.destination.findMany({
      orderBy: { name: "asc" },
      select: { slug: true, name: true, country: true },
    }),
    getHotelProvider().search(params),
    params.destinationSlug
      ? db.destination.findUnique({ where: { slug: params.destinationSlug } })
      : Promise.resolve(null),
  ]);

  const destinationOptions = destinations.map((d) => ({
    slug: d.slug,
    label: `${d.name}, ${d.country}`,
  }));

  const ci = parseISODate(params.checkIn);
  const co = parseISODate(params.checkOut);
  const dateLabel = ci && co ? formatDateRange(ci, co) : "";

  const fullQuery = searchParamsToQuery(params);
  const baseQuery = searchParamsToQuery({ ...params, page: 1 });

  const heading = activeDestination
    ? `Hotels in ${activeDestination.name}`
    : params.query
      ? `Hotels matching “${params.query}”`
      : "All hotels";

  return (
    <>
      <SiteHeader />
      <main className="container-page py-8">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-semibold tracking-tight">{heading}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {dateLabel} · {params.guests} guest{params.guests === 1 ? "" : "s"} ·{" "}
            {params.rooms} room{params.rooms === 1 ? "" : "s"}
          </p>
        </div>

        <SearchBar destinations={destinationOptions} className="mb-8" />

        <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
          <div className="lg:sticky lg:top-20 lg:h-fit">
            <FiltersPanel facets={result.facets} />
          </div>

          <section aria-label="Search results" className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{result.total}</span>{" "}
                {result.total === 1 ? "property" : "properties"} found
              </p>
              <SortSelect />
            </div>

            {result.hotels.length === 0 ? (
              <EmptyState />
            ) : (
              <ResultsView
                points={result.hotels.map((h) => ({
                  lat: h.latitude,
                  lng: h.longitude,
                  name: h.name,
                }))}
              >
                <div className="space-y-5">
                  {result.hotels.map((hotel) => (
                    <HotelCard
                      key={hotel.id}
                      hotel={hotel}
                      query={fullQuery}
                      checkIn={params.checkIn}
                      checkOut={params.checkOut}
                      rooms={params.rooms}
                    />
                  ))}
                </div>
              </ResultsView>
            )}

            <Pagination
              page={result.page}
              pageSize={result.pageSize}
              total={result.total}
              baseQuery={baseQuery}
            />
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
      <SearchX className="size-10 text-muted-foreground" aria-hidden />
      <h2 className="mt-4 text-lg font-semibold">No properties match your filters</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Try widening your price range, removing some amenities, or searching a
        different destination.
      </p>
    </div>
  );
}
