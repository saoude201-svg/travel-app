import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { TripPlanner } from "@/components/suggestions/trip-planner";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "AI Trip Planner",
  description:
    "Tell us your budget, dates, and vibe — get AI-crafted destination ideas with itineraries and budgets, then book the stay.",
};

export default function SuggestionsPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <div className="mb-8 max-w-2xl">
          <Badge variant="accent" className="mb-3 gap-1.5">
            <Sparkles className="size-3.5" aria-hidden /> AI Trip Planner
          </Badge>
          <h1 className="font-serif text-4xl font-semibold tracking-tight">
            Where should you go next?
          </h1>
          <p className="mt-2 text-muted-foreground">
            Share a few preferences and we&apos;ll suggest destinations worth the
            airfare — each with a sample itinerary, an estimated budget, and the
            best season to visit. Like one? Jump straight into hotel search.
          </p>
        </div>
        <TripPlanner />
      </main>
      <SiteFooter />
    </>
  );
}
