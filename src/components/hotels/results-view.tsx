"use client";

import { useState } from "react";
import { List, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HotelMap, type MapPoint } from "@/components/hotels/hotel-map";

export function ResultsView({
  children,
  points,
}: {
  children: React.ReactNode;
  points: MapPoint[];
}) {
  const [view, setView] = useState<"list" | "map">("list");

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="inline-flex rounded-md border p-0.5" role="group" aria-label="Result view">
          <Button
            type="button"
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            <List className="size-4" aria-hidden /> List
          </Button>
          <Button
            type="button"
            variant={view === "map" ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={view === "map"}
            onClick={() => setView("map")}
          >
            <MapIcon className="size-4" aria-hidden /> Map
          </Button>
        </div>
      </div>

      {view === "list" ? children : <HotelMap points={points} />}
    </div>
  );
}
