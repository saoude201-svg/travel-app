import type { TripPreferences } from "./schema";

export interface AvailableDestination {
  slug: string;
  name: string;
  country: string;
}

export const SYSTEM_PROMPT = `You are an expert travel planner for a hotel-booking platform.
Given a traveler's preferences, recommend 3–5 destinations that genuinely fit their budget, dates, party, and vibe.

Rules:
- Respond with JSON ONLY. No prose, no markdown fences, no commentary.
- The JSON MUST match this exact shape:
{
  "suggestions": [
    {
      "destination": "City or area name",
      "country": "Country",
      "matchedSlug": "<one of the available slugs, or null>",
      "rationale": "2–4 sentences on why this fits THEIR preferences",
      "bestSeason": "When to go and why, relative to their dates",
      "highlights": ["3–6 short highlights"],
      "itinerary": [{ "day": 1, "title": "Short title", "detail": "1–2 sentences" }],
      "budget": {
        "lodgingUsd": 0, "foodUsd": 0, "activitiesUsd": 0,
        "transportUsd": 0, "totalUsd": 0
      }
    }
  ]
}
- The itinerary length should roughly match the trip length (cap at 14 days).
- Budget figures are realistic estimates for the WHOLE party and WHOLE trip in USD; totalUsd should be the sum and should respect the stated budget.
- Prefer destinations from the provided "available destinations" list and set matchedSlug accordingly. You may include one destination outside the list if it's a clearly superior fit; set its matchedSlug to null.`;

export function buildUserPrompt(
  prefs: TripPreferences,
  available: AvailableDestination[],
): string {
  const list = available.map((d) => `- ${d.slug}: ${d.name}, ${d.country}`).join("\n");
  return `Traveler preferences:
- Travelling from: ${prefs.origin}
- Total budget: $${prefs.budgetUsd.toLocaleString()} USD for the whole party
- Party size: ${prefs.travelers}
- Trip length: ${prefs.tripLengthDays} days
- Timing: ${prefs.month === "any" ? "no fixed month" : prefs.month} (${prefs.flexibility} dates)
- Vibes: ${prefs.vibes.join(", ")}
- Interests: ${prefs.interests.length ? prefs.interests.join(", ") : "none specified"}

Available destinations (prefer these; use the slug for matchedSlug):
${list}

Return JSON only.`;
}
