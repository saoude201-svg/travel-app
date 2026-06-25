import Link from "next/link";
import { ArrowRight, CalendarRange, MapPin, Sparkles } from "lucide-react";
import type { DestinationSuggestion } from "@/lib/ai/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export function SuggestionCard({
  suggestion,
  guests,
  rooms,
}: {
  suggestion: DestinationSuggestion;
  guests: number;
  rooms: number;
}) {
  const s = suggestion;
  const hotelsHref = s.matchedSlug
    ? `/hotels?destination=${s.matchedSlug}&guests=${guests}&rooms=${rooms}`
    : `/hotels?q=${encodeURIComponent(s.destination)}&guests=${guests}&rooms=${rooms}`;

  const budgetRows = [
    { label: "Lodging", value: s.budget.lodgingUsd },
    { label: "Food", value: s.budget.foodUsd },
    { label: "Activities", value: s.budget.activitiesUsd },
    { label: "Transport", value: s.budget.transportUsd },
  ];

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-serif text-2xl font-semibold">
              <MapPin className="size-5 text-primary" aria-hidden />
              {s.destination}
            </h3>
            <p className="text-sm text-muted-foreground">{s.country}</p>
          </div>
          {s.matchedSlug ? (
            <Badge variant="accent" className="gap-1">
              <Sparkles className="size-3" aria-hidden /> Bookable here
            </Badge>
          ) : (
            <Badge variant="secondary">Inspiration</Badge>
          )}
        </div>

        <p className="leading-relaxed text-muted-foreground">{s.rationale}</p>

        <div className="flex flex-wrap gap-1.5">
          {s.highlights.map((h) => (
            <Badge key={h} variant="secondary">{h}</Badge>
          ))}
        </div>

        <p className="flex items-start gap-2 text-sm">
          <CalendarRange className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span><span className="font-medium">Best season:</span> {s.bestSeason}</span>
        </p>

        <Separator />

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Itinerary */}
          <div>
            <h4 className="mb-2 text-sm font-semibold">Sample itinerary</h4>
            <ol className="space-y-2">
              {s.itinerary.map((day) => (
                <li key={day.day} className="flex gap-3 text-sm">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {day.day}
                  </span>
                  <span>
                    <span className="font-medium">{day.title}.</span>{" "}
                    <span className="text-muted-foreground">{day.detail}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Budget */}
          <div>
            <h4 className="mb-2 text-sm font-semibold">Estimated budget</h4>
            <dl className="space-y-1.5 text-sm">
              {budgetRows.map((r) => (
                <div key={r.label} className="flex justify-between">
                  <dt className="text-muted-foreground">{r.label}</dt>
                  <dd className="font-medium">{usd(r.value)}</dd>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-semibold">
                <dt>Total</dt>
                <dd>{usd(s.budget.totalUsd)}</dd>
              </div>
            </dl>
            <p className="mt-1 text-xs text-muted-foreground">Whole party, whole trip (estimate).</p>
          </div>
        </div>

        <Button asChild className="w-full sm:w-auto">
          <Link href={hotelsHref}>
            Search hotels in {s.destination} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
