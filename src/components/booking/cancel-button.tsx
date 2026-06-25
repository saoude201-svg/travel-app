"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CancelButton({
  reference,
  freeUntilLabel,
  refundable,
}: {
  reference: string;
  freeUntilLabel: string | null;
  refundable: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${reference}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not cancel.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel.");
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <div className="space-y-2">
        <Button variant="outline" onClick={() => setConfirming(true)}>
          Cancel booking
        </Button>
        <p className="text-xs text-muted-foreground">
          {refundable && freeUntilLabel
            ? `Free cancellation until ${freeUntilLabel}.`
            : "This booking is non-refundable."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <p className="text-sm font-medium">Cancel this booking?</p>
      <p className="text-xs text-muted-foreground">
        {refundable && freeUntilLabel
          ? "You'll be refunded in full."
          : "No refund will be issued per the cancellation policy."}
      </p>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <Button variant="destructive" size="sm" onClick={cancel} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Yes, cancel
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={loading}>
          Keep booking
        </Button>
      </div>
    </div>
  );
}
