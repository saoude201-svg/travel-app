# Wanderlust — AI Travel & Hotel Booking Platform

Describe your trip, get **AI-crafted destination ideas**, then **search and book
hotels** end-to-end. Built as a production-grade reference app: Next.js (App
Router) + TypeScript, PostgreSQL/Prisma, Auth.js, Stripe Payment Intents, and a
**swappable hotel-provider** layer so it runs fully on realistic mock inventory
today and switches to a live partner API by flipping one env flag.

> ⚠️ This is a reference implementation. Before taking real money you have legal
> and operational decisions to make — see **[Going live](#going-live-flags)**.

---

## Features

- **AI Trip Planner** — guided preferences (budget, dates, origin, length, vibe,
  party, interests) → 3–5 destination suggestions with rationale, sample
  itinerary, budget breakdown, and best-season note. Model output is validated
  against a Zod schema; works with a deterministic fallback when no API key.
- **Hotel search** — destination/dates/guests, filters (price, stars, guest
  rating, amenities, free cancellation), sort, pagination, list/map views.
- **Hotel detail** — gallery, amenities, room offers with live availability and
  server-computed totals, mock reviews, map.
- **Booking + payments** — guest details → Stripe Payment Intents → webhook
  confirmation. Prices are always recomputed server-side; idempotent.
- **Accounts** — email/password + optional Google OAuth, "My Trips" dashboard,
  policy-aware cancellation.
- **Admin** — lightweight operational view of all bookings.

## Tech stack

Next.js 16 · TypeScript (strict) · Tailwind v4 + shadcn-style UI · PostgreSQL +
Prisma 7 (driver adapter) · Auth.js v5 · Stripe · Anthropic SDK · TanStack Query
· Zod · Vitest + Playwright.

---

## Quick start

### 1. Prerequisites
- Node.js 20+ and a PostgreSQL database (local, [Neon](https://neon.tech), or
  [Supabase](https://supabase.com)).

### 2. Install & configure
```bash
npm install
cp .env.example .env       # then fill in values (see below)
```

### 3. Database
```bash
npm run db:migrate         # apply migrations
npm run db:seed            # 12 destinations, ~57 hotels, demo + admin users
```

### 4. Run
```bash
npm run dev                # http://localhost:3000
```

**Demo logins** (after seeding):
- User: `demo@wanderlust.test` / `password123`
- Admin: `admin@wanderlust.test` / `password123`

The app is fully functional out of the box: `HOTEL_PROVIDER=mock` serves rich
seed inventory, AI planning falls back to built-in suggestions without a key,
and checkout runs in a clearly-labelled **dev mode** when Stripe isn't
configured.

---

## Environment variables

See [`.env.example`](./.env.example) for the annotated list. Summary:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | Auth.js session secret (`openssl rand -base64 32`) |
| `AUTH_URL` | ✅ | App base URL (`http://localhost:3000` in dev) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional | Google OAuth (auto-enabled when both set) |
| `ANTHROPIC_API_KEY` | optional | Live AI suggestions (falls back without it) |
| `ANTHROPIC_MODEL` | optional | Defaults to `claude-sonnet-4-6` |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | optional | Stripe payments (dev mode without them) |
| `STRIPE_WEBHOOK_SECRET` | optional | Verifying Stripe webhooks |
| `HOTEL_PROVIDER` | ✅ | `mock` (default) or `real` |

No keys are required to develop the full flow — they unlock the live AI, Google
sign-in, and real card payments.

---

## Stripe test flow

1. Add `STRIPE_SECRET_KEY` (test) and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   (test) to `.env`.
2. Forward webhooks locally and copy the printed `whsec_...` into
   `STRIPE_WEBHOOK_SECRET`:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
3. Book a stay and pay with test card **`4242 4242 4242 4242`**, any future
   expiry, any CVC/ZIP. The webhook flips the booking to **CONFIRMED**.
4. Other useful cards: `4000 0000 0000 9995` (declined),
   `4000 0025 0000 3155` (requires authentication).

Without Stripe keys, checkout uses a simulated "Pay (dev mode)" button so the
end-to-end flow still works.

---

## Switching mock → real hotel provider

The app talks to inventory through `HotelProvider`
(`src/lib/providers/hotel/types.ts`). To go live:

1. Set `HOTEL_PROVIDER=real`.
2. Implement the TODOs in `src/lib/providers/hotel/real.ts` (it's a fully
   stubbed skeleton with each API call site marked). Map the partner's response
   shape into the provider-agnostic DTOs — nothing downstream changes.
3. Add the partner's credentials to `.env`.

**Recommended first integration: [Amadeus Self-Service](https://developers.amadeus.com).**
Instant free sandbox, no partner approval or deposit to start — ideal for wiring
up `RealHotelProvider`. The stub is already Amadeus-oriented (OAuth2 token →
`/v3/shopping/hotel-offers` → `/v2/booking/hotel-orders`).

Other options and what each needs:
| Provider | Approval | Sandbox | Deposit |
| --- | --- | --- | --- |
| Amadeus Self-Service | none to start | ✅ instant | none |
| Hotelbeds APItude | partner approval | ✅ | none upfront |
| Expedia Rapid | partner approval (heavier) | ✅ | varies |
| Booking.com Demand API | partner/contract | limited | varies |

---

## AI suggestions

`POST /api/suggestions` validates input with Zod, calls Claude
(`src/lib/ai/`), then **validates the model's JSON output against a Zod schema**
before returning it. The model is instructed to return JSON only and to prefer
our available destinations (so suggestions link straight into hotel search). If
`ANTHROPIC_API_KEY` is unset or the model returns something invalid, a
deterministic local generator produces schema-valid suggestions instead.

---

## Testing

```bash
npm run test         # unit: pricing, provider adapter, AI-output validator
npm run build        # typecheck + production build
npm run test:e2e     # Playwright happy-path booking (build first)
```

Unit tests cover the server-authoritative pricing logic, the mock provider
adapter (DB-backed), the provider factory, and the AI-output validator. The e2e
test drives the full sign-in → search → book → confirmation path.

---

## Deploy to Vercel

1. Push to a Git repo and import it in Vercel.
2. Add all env vars from `.env.example` in the Vercel project settings. Use a
   hosted Postgres (Neon/Supabase) for `DATABASE_URL`.
3. Build command is `npm run build` (runs `prisma generate` first). Run
   `npm run db:deploy` against the production DB to apply migrations (e.g. as a
   release step or one-off), then `npm run db:seed` if you want demo data.
4. Set `AUTH_URL` to your production URL and add the Stripe webhook endpoint
   (`https://your-app/api/stripe/webhook`) in the Stripe dashboard, copying its
   signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Add `https://your-app/api/auth/callback/google` as an authorized redirect URI
   if using Google OAuth.

---

## <a id="going-live-flags"></a>Going live — legal & operational flags

Acting as merchant/agent of record makes you a **"seller of travel."** This app
deliberately does **not** implement legal logic — these are the touchpoints you
must resolve with real advice:

- **Seller-of-travel registration** — likely required in CA, FL, WA, HI (and
  international equivalents). Touchpoint: checkout disclosures + confirmation.
- **Refund / chargeback liability** — you carry it as merchant of record; Stripe
  disputes flow against you. Touchpoint: cancellation/refund service + webhook.
- **PCI scope** — Stripe Elements/Payment Intents keeps you in **SAQ A** (card
  data never touches your server). Don't ever POST raw card numbers to your API.
- **Tax / VAT** — lodging/occupancy taxes and EU VAT/MOSS need real rules. The
  pricing module (`src/lib/payments/pricing.ts`) uses a flat placeholder and is
  clearly marked; replace it with a real tax engine.

**Needs your keys/accounts to run live:** Anthropic (AI), Stripe test keys +
`stripe listen` webhook secret, Google OAuth credentials, and a Postgres URL.

---

## Project structure

```
prisma/                 schema, migrations, seed + seed-data
src/
  app/                  routes: /, /hotels, /hotels/[slug], /suggestions,
                        /booking, /trips, /trips/[reference], /admin, /signin,
                        /signup, /profile, /api/*
  components/           ui/ (shadcn-style) + feature components (hotels,
                        booking, suggestions, site)
  lib/
    providers/hotel/    HotelProvider interface, MockHotelProvider,
                        RealHotelProvider stub, factory
    ai/                 schema, prompt, Anthropic client, output validator
    payments/           pricing (server-authoritative), Stripe client
    auth.ts, db.ts, session.ts, validations/
  server/               booking service, auth actions
  design/tokens.ts      brand palette/tokens (retune with globals.css)
tests/                  Vitest unit tests
e2e/                    Playwright tests
```
