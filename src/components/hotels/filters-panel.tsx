"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

export interface FilterFacets {
  priceRange: { minCents: number; maxCents: number };
  amenities: string[];
}

export function FiltersPanel({ facets }: { facets: FilterFacets }) {
  const router = useRouter();
  const params = useSearchParams();

  const minDollars = Math.floor(facets.priceRange.minCents / 100);
  const maxDollars = Math.ceil(facets.priceRange.maxCents / 100);

  const update = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      next.delete("page");
      router.push(`/hotels?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  // --- Price (debounced) ---
  const initialPrice: [number, number] = [
    Number(params.get("priceMin")) || minDollars,
    Number(params.get("priceMax")) || maxDollars,
  ];
  const [price, setPrice] = useState<[number, number]>(initialPrice);

  useEffect(() => {
    setPrice([
      Number(params.get("priceMin")) || minDollars,
      Number(params.get("priceMax")) || maxDollars,
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  function commitPrice(value: number[]) {
    update((p) => {
      if (value[0] > minDollars) p.set("priceMin", String(value[0]));
      else p.delete("priceMin");
      if (value[1] < maxDollars) p.set("priceMax", String(value[1]));
      else p.delete("priceMax");
    });
  }

  const selectedStars = (params.get("stars") ?? "").split(",").filter(Boolean);
  const selectedAmenities = (params.get("amenities") ?? "").split(",").filter(Boolean);
  const minRating = params.get("minRating") ?? "";
  const freeCancel = params.get("freeCancellation") === "1";

  function toggleListParam(key: string, value: string, current: string[]) {
    const set = new Set(current);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    update((p) => {
      if (set.size) p.set(key, [...set].join(","));
      else p.delete(key);
    });
  }

  const hasActiveFilters =
    params.has("priceMin") ||
    params.has("priceMax") ||
    selectedStars.length > 0 ||
    selectedAmenities.length > 0 ||
    minRating !== "" ||
    freeCancel;

  function clearAll() {
    update((p) => {
      ["priceMin", "priceMax", "stars", "amenities", "minRating", "freeCancellation"].forEach((k) =>
        p.delete(k),
      );
    });
  }

  return (
    <aside className="space-y-6" aria-label="Filters">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Filters</h2>
        {hasActiveFilters ? (
          <Button variant="link" size="sm" className="h-auto p-0" onClick={clearAll}>
            Clear all
          </Button>
        ) : null}
      </div>

      {/* Price */}
      {maxDollars > minDollars ? (
        <div className="space-y-3">
          <Label>Price per night</Label>
          <Slider
            min={minDollars}
            max={maxDollars}
            step={Math.max(1, Math.round((maxDollars - minDollars) / 50))}
            value={price}
            onValueChange={(v) => setPrice([v[0], v[1]])}
            onValueCommit={commitPrice}
            aria-label="Price range"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatCurrency(price[0] * 100)}</span>
            <span>{formatCurrency(price[1] * 100)}</span>
          </div>
        </div>
      ) : null}

      <Separator />

      {/* Star rating */}
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium">Star rating</legend>
        {[5, 4, 3].map((star) => (
          <label key={star} className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={selectedStars.includes(String(star))}
              onCheckedChange={() => toggleListParam("stars", String(star), selectedStars)}
            />
            {"★".repeat(star)} {star} stars
          </label>
        ))}
      </fieldset>

      <Separator />

      {/* Guest rating */}
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium">Guest rating</legend>
        {[
          { v: "9", l: "Exceptional 9+" },
          { v: "8", l: "Very good 8+" },
          { v: "7", l: "Good 7+" },
        ].map((opt) => (
          <label key={opt.v} className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={minRating === opt.v}
              onCheckedChange={(c) =>
                update((p) => (c ? p.set("minRating", opt.v) : p.delete("minRating")))
              }
            />
            {opt.l}
          </label>
        ))}
      </fieldset>

      <Separator />

      {/* Free cancellation */}
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <Checkbox
          checked={freeCancel}
          onCheckedChange={(c) =>
            update((p) => (c ? p.set("freeCancellation", "1") : p.delete("freeCancellation")))
          }
        />
        Free cancellation
      </label>

      <Separator />

      {/* Amenities */}
      {facets.amenities.length ? (
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium">Amenities</legend>
          <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
            {facets.amenities.map((a) => (
              <label key={a} className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={selectedAmenities.includes(a)}
                  onCheckedChange={() => toggleListParam("amenities", a, selectedAmenities)}
                />
                {a}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
    </aside>
  );
}
