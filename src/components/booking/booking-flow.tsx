"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StripePayment } from "@/components/booking/stripe-payment";
import { formatCurrency } from "@/lib/utils";
import type { BookingContext } from "@/lib/validations/booking";

type Step = "details" | "payment";

interface CreateResponse {
  reference: string;
  clientSecret: string | null;
  devMode: boolean;
  totalCents: number;
}

export function BookingFlow({
  context,
  totalCents,
  publishableKey,
  defaultEmail,
  defaultName,
}: {
  context: BookingContext;
  totalCents: number;
  publishableKey: string | null;
  defaultEmail?: string | null;
  defaultName?: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreateResponse | null>(null);

  const [first, last] = (defaultName ?? "").split(" ");
  const [form, setForm] = useState({
    guestFirstName: first ?? "",
    guestLastName: last ?? "",
    guestEmail: defaultEmail ?? "",
    guestPhone: "",
    specialRequests: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...context, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start your booking.");
      setCreated(data);
      setStep("payment");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function devPay() {
    if (!created) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${created.reference}/dev-confirm`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Payment simulation failed.");
      }
      router.push(`/trips/${created.reference}?confirmed=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  if (step === "payment" && created) {
    return (
      <div className="space-y-5">
        <StepHeader step={2} title="Payment" />
        {created.devMode || !created.clientSecret || !publishableKey ? (
          <div className="space-y-4 rounded-xl border bg-card p-5">
            <p className="flex items-start gap-2 rounded-lg bg-secondary/60 p-3 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                <strong>Dev mode:</strong> Stripe isn&apos;t configured, so payment is
                simulated. Add Stripe test keys to enable the real Payment Intents flow.
              </span>
            </p>
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
            <Button onClick={devPay} className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Lock className="size-4" aria-hidden />}
              Pay {formatCurrency(created.totalCents)} (simulated)
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-5">
            <StripePayment
              publishableKey={publishableKey}
              clientSecret={created.clientSecret}
              amountLabel={formatCurrency(created.totalCents)}
              onPaid={() => router.push(`/trips/${created.reference}?confirmed=1`)}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submitDetails} className="space-y-5">
      <StepHeader step={1} title="Guest details" />
      <div className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
        <Field id="guestFirstName" label="First name" value={form.guestFirstName} onChange={(v) => set("guestFirstName", v)} autoComplete="given-name" required />
        <Field id="guestLastName" label="Last name" value={form.guestLastName} onChange={(v) => set("guestLastName", v)} autoComplete="family-name" required />
        <Field id="guestEmail" label="Email" type="email" value={form.guestEmail} onChange={(v) => set("guestEmail", v)} autoComplete="email" required />
        <Field id="guestPhone" label="Phone (optional)" type="tel" value={form.guestPhone} onChange={(v) => set("guestPhone", v)} autoComplete="tel" />
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="specialRequests">Special requests (optional)</Label>
          <textarea
            id="specialRequests"
            value={form.specialRequests}
            onChange={(e) => set("specialRequests", e.target.value)}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Late check-in, high floor, dietary needs…"
          />
        </div>
      </div>

      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        Continue to payment
      </Button>
    </form>
  );
}

function StepHeader({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {step}
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
