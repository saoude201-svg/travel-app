"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Sparkles, Plus, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { DestinationSuggestion, Vibe } from "@/lib/ai/schema";
import { SuggestionCard } from "@/components/suggestions/suggestion-card";

const VIBES: { value: Vibe; label: string; emoji: string }[] = [
  { value: "BEACH", label: "Beach", emoji: "🏖️" },
  { value: "CITY", label: "City", emoji: "🏙️" },
  { value: "CULTURE", label: "Culture", emoji: "🏛️" },
  { value: "ADVENTURE", label: "Adventure", emoji: "🥾" },
  { value: "RELAX", label: "Relax", emoji: "🧘" },
];

const MONTHS = [
  "any", "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

interface ApiResponse {
  source: "ai" | "fallback";
  suggestions: DestinationSuggestion[];
}

export function TripPlanner() {
  const [origin, setOrigin] = useState("");
  const [budgetUsd, setBudgetUsd] = useState("3000");
  const [travelers, setTravelers] = useState("2");
  const [tripLengthDays, setTripLengthDays] = useState("7");
  const [month, setMonth] = useState("any");
  const [flexibility, setFlexibility] = useState("flexible");
  const [vibes, setVibes] = useState<Vibe[]>(["RELAX"]);
  const [interests, setInterests] = useState<string[]>([]);
  const [interestDraft, setInterestDraft] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation<ApiResponse, Error, void>({
    mutationFn: async () => {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          budgetUsd: Number(budgetUsd),
          travelers: Number(travelers),
          tripLengthDays: Number(tripLengthDays),
          month,
          flexibility,
          vibes,
          interests,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong generating suggestions.");
      }
      return res.json();
    },
  });

  function toggleVibe(v: Vibe) {
    setVibes((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }

  function addInterest() {
    const value = interestDraft.trim();
    if (value && !interests.includes(value) && interests.length < 12) {
      setInterests((prev) => [...prev, value]);
    }
    setInterestDraft("");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!origin.trim()) return setFormError("Tell us where you're travelling from.");
    if (vibes.length === 0) return setFormError("Pick at least one vibe.");
    mutation.mutate();
  }

  const guests = Number(travelers) || 2;
  const rooms = Math.max(1, Math.ceil(guests / 2));

  return (
    <div className="grid gap-10 lg:grid-cols-[22rem_1fr] lg:items-start">
      {/* Form */}
      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-xl border bg-card p-6 shadow-sm lg:sticky lg:top-20"
      >
        <div className="space-y-1.5">
          <Label htmlFor="origin">Travelling from</Label>
          <Input id="origin" placeholder="e.g. London" value={origin} onChange={(e) => setOrigin(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="budget">Budget (USD)</Label>
            <Input id="budget" type="number" min={100} step={100} value={budgetUsd} onChange={(e) => setBudgetUsd(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="travelers">Travelers</Label>
            <Input id="travelers" type="number" min={1} max={16} value={travelers} onChange={(e) => setTravelers(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="length">Trip length (days)</Label>
            <Input id="length" type="number" min={1} max={60} value={tripLengthDays} onChange={(e) => setTripLengthDays(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="month">When</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger id="month"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={m} className="capitalize">{m === "any" ? "Any time" : m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="flex">Date flexibility</Label>
          <Select value={flexibility} onValueChange={setFlexibility}>
            <SelectTrigger id="flex"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="exact">Exact dates</SelectItem>
              <SelectItem value="flexible">Flexible (±few days)</SelectItem>
              <SelectItem value="very_flexible">Very flexible</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Vibe</Label>
          <div className="flex flex-wrap gap-2">
            {VIBES.map((v) => (
              <button
                key={v.value}
                type="button"
                aria-pressed={vibes.includes(v.value)}
                onClick={() => toggleVibe(v.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  vibes.includes(v.value)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-secondary",
                )}
              >
                <span aria-hidden>{v.emoji}</span> {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="interest">Interests (optional)</Label>
          <div className="flex gap-2">
            <Input
              id="interest"
              placeholder="e.g. food, hiking, art"
              value={interestDraft}
              onChange={(e) => setInterestDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addInterest();
                }
              }}
            />
            <Button type="button" variant="outline" size="icon" onClick={addInterest} aria-label="Add interest">
              <Plus className="size-4" aria-hidden />
            </Button>
          </div>
          {interests.length ? (
            <div className="flex flex-wrap gap-1.5">
              {interests.map((i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {i}
                  <button type="button" onClick={() => setInterests((p) => p.filter((x) => x !== i))} aria-label={`Remove ${i}`}>
                    <X className="size-3" aria-hidden />
                  </button>
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        {formError ? <p role="alert" className="text-sm text-destructive">{formError}</p> : null}

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
          {mutation.isPending ? "Planning…" : "Get suggestions"}
        </Button>
      </form>

      {/* Results */}
      <div className="space-y-6">
        {mutation.isIdle ? (
          <Placeholder />
        ) : mutation.isPending ? (
          <LoadingState />
        ) : mutation.isError ? (
          <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {mutation.error.message}
          </p>
        ) : mutation.data ? (
          <>
            {mutation.data.source === "fallback" ? (
              <p className="flex items-start gap-2 rounded-lg bg-secondary/60 p-3 text-sm text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                Showing built-in suggestions. Add an <code>ANTHROPIC_API_KEY</code> to enable live AI planning.
              </p>
            ) : (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="size-4 text-accent" aria-hidden /> AI-generated for your preferences
              </p>
            )}
            {mutation.data.suggestions.map((s, i) => (
              <SuggestionCard key={`${s.destination}-${i}`} suggestion={s} guests={guests} rooms={rooms} />
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}

function Placeholder() {
  return (
    <div className="flex h-full min-h-80 flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center">
      <Sparkles className="size-10 text-accent" aria-hidden />
      <h2 className="mt-4 text-lg font-semibold">Your trip ideas will appear here</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Fill in your preferences and we&apos;ll suggest destinations with itineraries, budgets, and the best time to go.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4" aria-live="polite" aria-busy>
      {[0, 1].map((i) => (
        <div key={i} className="animate-pulse space-y-4 rounded-xl border bg-card p-6">
          <div className="h-6 w-1/3 rounded bg-secondary" />
          <div className="h-4 w-full rounded bg-secondary" />
          <div className="h-4 w-5/6 rounded bg-secondary" />
          <div className="h-24 w-full rounded bg-secondary" />
        </div>
      ))}
    </div>
  );
}
