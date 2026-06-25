import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, buildUserPrompt, type AvailableDestination } from "./prompt";
import { validateSuggestionResponse } from "./validate";
import type {
  DestinationSuggestion,
  SuggestionResponse,
  TripPreferences,
  Vibe,
} from "./schema";

/** Richer destination data used by the offline fallback generator. */
export interface PlannerDestination extends AvailableDestination {
  vibes: Vibe[];
  bestSeason: string;
  description: string;
  avgDailyBudgetCents: number;
}

export interface GenerateResult {
  source: "ai" | "fallback";
  data: SuggestionResponse;
}

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

/**
 * Generate destination suggestions. Uses the Anthropic API when
 * ANTHROPIC_API_KEY is set; otherwise returns a deterministic, schema-valid
 * fallback so the feature works end-to-end without a key (clearly flagged).
 */
export async function generateSuggestions(
  prefs: TripPreferences,
  destinations: PlannerDestination[],
): Promise<GenerateResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { source: "fallback", data: fallbackSuggestions(prefs, destinations) };
  }

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(
          prefs,
          destinations.map(({ slug, name, country }) => ({ slug, name, country })),
        ),
      },
    ],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const validated = validateSuggestionResponse(text);
  if (!validated.success) {
    // The model returned something unusable — don't surface garbage; fall back.
    console.error("AI suggestion validation failed:", validated.error);
    return { source: "fallback", data: fallbackSuggestions(prefs, destinations) };
  }
  return { source: "ai", data: validated.data };
}

// ---------------------------------------------------------------------------
// Deterministic offline fallback
// ---------------------------------------------------------------------------
function fallbackSuggestions(
  prefs: TripPreferences,
  destinations: PlannerDestination[],
): SuggestionResponse {
  const wanted = new Set(prefs.vibes);
  const scored = destinations
    .map((d) => ({
      d,
      score: d.vibes.reduce((s, v) => s + (wanted.has(v) ? 2 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score || a.d.name.localeCompare(b.d.name));

  const top = scored.slice(0, Math.min(4, Math.max(3, scored.length))).map(({ d }) => d);
  const nights = prefs.tripLengthDays;
  const rooms = Math.ceil(prefs.travelers / 2);

  const suggestions: DestinationSuggestion[] = top.map((d) => {
    const daily = d.avgDailyBudgetCents / 100;
    const food = Math.round(daily * 0.4 * nights * prefs.travelers);
    const activities = Math.round(daily * 0.35 * nights * prefs.travelers);
    const transport = Math.round(daily * 0.25 * nights * prefs.travelers);
    const lodging = Math.round(daily * 1.3 * nights * rooms);
    const total = food + activities + transport + lodging;

    const matchedVibes = d.vibes.filter((v) => wanted.has(v));
    const days = Math.min(nights, 5);
    const itinerary = Array.from({ length: Math.max(1, days) }, (_, i) => ({
      day: i + 1,
      title:
        i === 0
          ? `Arrive in ${d.name}`
          : i === days - 1
            ? "Final highlights & departure"
            : `Explore ${d.name}`,
      detail:
        i === 0
          ? `Settle in, wander the neighbourhood, and ease into ${d.name}.`
          : `A day shaped around ${(prefs.interests[0] ?? matchedVibes[0]?.toLowerCase() ?? "local culture")} and the best of ${d.country}.`,
    }));

    return {
      destination: d.name,
      country: d.country,
      matchedSlug: d.slug,
      rationale: `${d.name} fits your ${prefs.vibes.join("/").toLowerCase()} vibe${
        matchedVibes.length ? ` (${matchedVibes.join(", ").toLowerCase()})` : ""
      } and works well for a party of ${prefs.travelers}. ${d.description.split(". ")[0]}.`,
      bestSeason: d.bestSeason,
      highlights: d.description
        .split(/[.,]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 8)
        .slice(0, 4),
      itinerary,
      budget: {
        lodgingUsd: lodging,
        foodUsd: food,
        activitiesUsd: activities,
        transportUsd: transport,
        totalUsd: total,
      },
    };
  });

  return { suggestions };
}
