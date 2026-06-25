import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { tripPreferencesSchema } from "@/lib/ai/schema";
import { generateSuggestions, type PlannerDestination } from "@/lib/ai/suggestions";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = tripPreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid preferences", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const destinations = await db.destination.findMany({
    select: {
      slug: true,
      name: true,
      country: true,
      vibes: true,
      bestSeason: true,
      description: true,
      avgDailyBudgetCents: true,
    },
  });

  let result;
  try {
    result = await generateSuggestions(parsed.data, destinations as PlannerDestination[]);
  } catch (e) {
    console.error("Suggestion generation error:", e);
    return NextResponse.json(
      { error: "We couldn't generate suggestions right now. Please try again." },
      { status: 502 },
    );
  }

  // Persist for signed-in users so they show up under "Saved ideas".
  const session = await auth();
  let suggestionId: string | null = null;
  if (session?.user?.id) {
    const saved = await db.suggestion.create({
      data: {
        userId: session.user.id,
        input: parsed.data,
        results: result.data,
      },
      select: { id: true },
    });
    suggestionId = saved.id;
  }

  return NextResponse.json({
    source: result.source,
    suggestions: result.data.suggestions,
    suggestionId,
  });
}
