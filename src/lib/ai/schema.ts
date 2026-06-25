import { z } from "zod";

// --- Vibe ------------------------------------------------------------------
export const vibeEnum = z.enum(["BEACH", "CITY", "CULTURE", "ADVENTURE", "RELAX"]);
export type Vibe = z.infer<typeof vibeEnum>;

// --- Input: the guided trip-preferences form -------------------------------
export const tripPreferencesSchema = z.object({
  origin: z.string().min(1, "Where are you travelling from?").max(80),
  budgetUsd: z.coerce.number().int().min(100, "Budget seems low").max(1_000_000),
  travelers: z.coerce.number().int().min(1).max(16),
  tripLengthDays: z.coerce.number().int().min(1).max(60),
  month: z
    .enum([
      "any", "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december",
    ])
    .default("any"),
  flexibility: z.enum(["exact", "flexible", "very_flexible"]).default("flexible"),
  vibes: z.array(vibeEnum).min(1, "Pick at least one vibe").max(5),
  interests: z.array(z.string().min(1).max(40)).max(12).default([]),
});

export type TripPreferences = z.infer<typeof tripPreferencesSchema>;

// --- Output: what the model must return ------------------------------------
const itineraryDaySchema = z.object({
  day: z.number().int().min(1).max(60),
  title: z.string().min(1).max(120),
  detail: z.string().min(1).max(600),
});

const budgetBreakdownSchema = z.object({
  lodgingUsd: z.number().min(0),
  foodUsd: z.number().min(0),
  activitiesUsd: z.number().min(0),
  transportUsd: z.number().min(0),
  totalUsd: z.number().min(0),
});

export const destinationSuggestionSchema = z.object({
  destination: z.string().min(1).max(80),
  country: z.string().min(1).max(80),
  // Slug of one of OUR available destinations, when this matches one; else null.
  matchedSlug: z.string().max(80).nullable().default(null),
  rationale: z.string().min(1).max(800),
  bestSeason: z.string().min(1).max(200),
  highlights: z.array(z.string().min(1).max(120)).min(1).max(8),
  itinerary: z.array(itineraryDaySchema).min(1).max(14),
  budget: budgetBreakdownSchema,
});

export type DestinationSuggestion = z.infer<typeof destinationSuggestionSchema>;

/** The full payload the model returns (JSON only). */
export const suggestionResponseSchema = z.object({
  suggestions: z.array(destinationSuggestionSchema).min(1).max(5),
});

export type SuggestionResponse = z.infer<typeof suggestionResponseSchema>;
