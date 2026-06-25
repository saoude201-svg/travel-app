import Stripe from "stripe";

/**
 * Lazily-instantiated Stripe client. Returns null when STRIPE_SECRET_KEY is
 * not configured, in which case the booking flow runs in a clearly-labelled
 * DEV MODE (no real PaymentIntent). Configure test keys to exercise the real
 * Payment Intents + webhook path — see README.
 */
let stripe: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (stripe !== undefined) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  stripe = key ? new Stripe(key) : null;
  return stripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getPublishableKey(): string | null {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null;
}
