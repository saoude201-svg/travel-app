import { describe, it, expect } from "vitest";
import { extractJson, validateSuggestionResponse } from "@/lib/ai/validate";
import { suggestionResponseSchema } from "@/lib/ai/schema";
import { generateSuggestions, type PlannerDestination } from "@/lib/ai/suggestions";
import type { TripPreferences } from "@/lib/ai/schema";

const validSuggestion = {
  destination: "Lisbon",
  country: "Portugal",
  matchedSlug: "lisbon",
  rationale: "Sunny, affordable, and walkable — a great fit for a relaxed city break.",
  bestSeason: "Spring and early autumn for mild weather.",
  highlights: ["Tram 28", "Pastéis de nata", "Alfama"],
  itinerary: [{ day: 1, title: "Arrive", detail: "Settle into Alfama and wander." }],
  budget: { lodgingUsd: 600, foodUsd: 300, activitiesUsd: 200, transportUsd: 150, totalUsd: 1250 },
};
const validPayload = JSON.stringify({ suggestions: [validSuggestion] });

describe("extractJson", () => {
  it("parses a plain JSON object", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });
  it("parses JSON inside ```json fences", () => {
    expect(extractJson("```json\n{\"a\":1}\n```")).toEqual({ a: 1 });
  });
  it("parses JSON inside bare ``` fences", () => {
    expect(extractJson("```\n{\"a\":1}\n```")).toEqual({ a: 1 });
  });
  it("extracts a JSON object embedded in prose", () => {
    expect(extractJson('Here you go: {"a":1} hope that helps')).toEqual({ a: 1 });
  });
  it("throws when there is no JSON", () => {
    expect(() => extractJson("no json here")).toThrow();
  });
});

describe("validateSuggestionResponse", () => {
  it("accepts a valid payload", () => {
    const r = validateSuggestionResponse(validPayload);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.suggestions[0].destination).toBe("Lisbon");
  });

  it("accepts a fenced valid payload", () => {
    const r = validateSuggestionResponse("```json\n" + validPayload + "\n```");
    expect(r.success).toBe(true);
  });

  it("rejects missing required fields with a helpful error", () => {
    const bad = JSON.stringify({ suggestions: [{ destination: "X" }] });
    const r = validateSuggestionResponse(bad);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.length).toBeGreaterThan(0);
  });

  it("rejects an empty suggestions array", () => {
    const r = validateSuggestionResponse(JSON.stringify({ suggestions: [] }));
    expect(r.success).toBe(false);
  });

  it("rejects non-JSON output", () => {
    const r = validateSuggestionResponse("I cannot help with that.");
    expect(r.success).toBe(false);
  });

  it("defaults matchedSlug to null when omitted", () => {
    const { matchedSlug, ...rest } = validSuggestion;
    void matchedSlug;
    const r = validateSuggestionResponse(JSON.stringify({ suggestions: [rest] }));
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.suggestions[0].matchedSlug).toBeNull();
  });
});

describe("fallback generator (no API key)", () => {
  const destinations: PlannerDestination[] = [
    { slug: "tulum", name: "Tulum", country: "Mexico", vibes: ["BEACH", "RELAX"], bestSeason: "Nov–Apr", description: "Beaches and cenotes. Jungle ruins.", avgDailyBudgetCents: 14000 },
    { slug: "kyoto", name: "Kyoto", country: "Japan", vibes: ["CULTURE", "CITY"], bestSeason: "Spring", description: "Temples and gardens. Tea houses.", avgDailyBudgetCents: 16000 },
    { slug: "banff", name: "Banff", country: "Canada", vibes: ["ADVENTURE"], bestSeason: "Summer", description: "Lakes and peaks. Hiking trails.", avgDailyBudgetCents: 16000 },
  ];

  const prefs: TripPreferences = {
    origin: "London",
    budgetUsd: 4000,
    travelers: 2,
    tripLengthDays: 6,
    month: "any",
    flexibility: "flexible",
    vibes: ["BEACH", "RELAX"],
    interests: ["food"],
  };

  it("returns schema-valid suggestions without an API key", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await generateSuggestions(prefs, destinations);
    expect(result.source).toBe("fallback");
    const parsed = suggestionResponseSchema.safeParse(result.data);
    expect(parsed.success).toBe(true);
  });

  it("ranks the best vibe match first", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await generateSuggestions(prefs, destinations);
    expect(result.data.suggestions[0].matchedSlug).toBe("tulum");
  });
});
