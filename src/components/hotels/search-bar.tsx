"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CalendarDays, MapPin, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultDates } from "@/lib/validations/search";

export interface DestinationOption {
  slug: string;
  label: string;
}

export function SearchBar({
  destinations,
  className,
}: {
  destinations: DestinationOption[];
  className?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const defaults = defaultDates();

  const initialDestination =
    destinations.find((d) => d.slug === params.get("destination"))?.label ??
    params.get("q") ??
    "";

  const [destination, setDestination] = useState(initialDestination);
  const [checkIn, setCheckIn] = useState(params.get("checkIn") ?? defaults.checkIn);
  const [checkOut, setCheckOut] = useState(params.get("checkOut") ?? defaults.checkOut);
  const [guests, setGuests] = useState(params.get("guests") ?? "2");
  const [rooms, setRooms] = useState(params.get("rooms") ?? "1");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Preserve existing filters/sort; reset to page 1.
    const next = new URLSearchParams(params.toString());
    next.delete("page");

    const matched = destinations.find(
      (d) => d.label.toLowerCase() === destination.trim().toLowerCase(),
    );
    if (matched) {
      next.set("destination", matched.slug);
      next.delete("q");
    } else if (destination.trim()) {
      next.set("q", destination.trim());
      next.delete("destination");
    } else {
      next.delete("destination");
      next.delete("q");
    }
    next.set("checkIn", checkIn);
    next.set("checkOut", checkOut > checkIn ? checkOut : defaults.checkOut);
    next.set("guests", guests);
    next.set("rooms", rooms);

    router.push(`/hotels?${next.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`grid gap-3 rounded-xl border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] ${className ?? ""}`}
    >
      <div className="space-y-1.5">
        <Label htmlFor="destination" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5" aria-hidden /> Destination
        </Label>
        <Input
          id="destination"
          list="destination-options"
          placeholder="Where to?"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        <datalist id="destination-options">
          {destinations.map((d) => (
            <option key={d.slug} value={d.label} />
          ))}
        </datalist>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="checkIn" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" aria-hidden /> Check-in
        </Label>
        <Input
          id="checkIn"
          type="date"
          value={checkIn}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setCheckIn(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="checkOut" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" aria-hidden /> Check-out
        </Label>
        <Input
          id="checkOut"
          type="date"
          value={checkOut}
          min={checkIn}
          onChange={(e) => setCheckOut(e.target.value)}
        />
      </div>

      <div className="flex items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="guests" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" aria-hidden /> Guests
          </Label>
          <Input
            id="guests"
            type="number"
            min={1}
            max={16}
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className="w-20"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rooms" className="text-xs text-muted-foreground">Rooms</Label>
          <Input
            id="rooms"
            type="number"
            min={1}
            max={8}
            value={rooms}
            onChange={(e) => setRooms(e.target.value)}
            className="w-20"
          />
        </div>
      </div>

      <Button type="submit" className="lg:col-span-4">
        <Search className="size-4" aria-hidden /> Search hotels
      </Button>
    </form>
  );
}
