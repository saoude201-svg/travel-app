import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedDatabase } from "../../../../../prisma/seed-core";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * One-time setup endpoint to load demo data into a fresh production database
 * without a terminal. Gated by the SETUP_SECRET env var — if it isn't set, the
 * route is disabled (404). Call it once after the first deploy:
 *   https://your-app/api/setup/seed?secret=YOUR_SETUP_SECRET
 * It is idempotent (wipes domain data and reseeds). Remove SETUP_SECRET
 * afterwards to permanently disable it.
 */
async function handle(req: Request) {
  const secret = process.env.SETUP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Seeding is disabled." }, { status: 404 });
  }
  const provided = new URL(req.url).searchParams.get("secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Invalid secret." }, { status: 401 });
  }

  try {
    const counts = await seedDatabase(db);
    return NextResponse.json({
      ok: true,
      ...counts,
      message:
        "Demo data loaded. Sign in with demo@wanderlust.test / password123. " +
        "Remove SETUP_SECRET to disable this endpoint.",
    });
  } catch (e) {
    console.error("Seed route failed:", e);
    return NextResponse.json({ error: "Seeding failed. Check server logs." }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
