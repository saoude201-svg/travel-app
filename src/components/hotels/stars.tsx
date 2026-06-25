import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating} star hotel`}>
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} className="size-3.5 fill-accent text-accent" aria-hidden />
      ))}
    </span>
  );
}

export function guestRatingLabel(rating: number): string {
  if (rating >= 9) return "Exceptional";
  if (rating >= 8) return "Very good";
  if (rating >= 7) return "Good";
  return "Pleasant";
}

export function GuestRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-9 min-w-9 items-center justify-center rounded-md rounded-bl-none bg-primary px-2 text-sm font-semibold text-primary-foreground">
        {rating.toFixed(1)}
      </span>
      <div className="text-sm leading-tight">
        <p className="font-medium">{guestRatingLabel(rating)}</p>
        {count != null ? (
          <p className="text-xs text-muted-foreground">{count.toLocaleString()} reviews</p>
        ) : null}
      </div>
    </div>
  );
}
