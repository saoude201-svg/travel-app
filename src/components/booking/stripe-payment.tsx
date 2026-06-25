"use client";

import { useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

let stripePromise: Promise<Stripe | null> | null = null;
function getStripePromise(pk: string) {
  if (!stripePromise) stripePromise = loadStripe(pk);
  return stripePromise;
}

export function StripePayment({
  publishableKey,
  clientSecret,
  amountLabel,
  onPaid,
}: {
  publishableKey: string;
  clientSecret: string;
  amountLabel: string;
  onPaid: () => void;
}) {
  return (
    <Elements stripe={getStripePromise(publishableKey)} options={{ clientSecret, appearance: { theme: "stripe" } }}>
      <PaymentInner amountLabel={amountLabel} onPaid={onPaid} />
    </Elements>
  );
}

function PaymentInner({ amountLabel, onPaid }: { amountLabel: string; onPaid: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }
    if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
      onPaid();
      return;
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error ? (
        <p role="alert" className="text-sm text-destructive">{error}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={!stripe || submitting}>
        {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        Pay {amountLabel}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Payments are processed securely by Stripe. Card details never touch our servers.
      </p>
    </form>
  );
}
