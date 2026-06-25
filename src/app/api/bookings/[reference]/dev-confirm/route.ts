import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { devConfirmBooking, BookingError } from "@/server/booking";

export const runtime = "nodejs";

// DEV MODE only — simulates a successful payment when Stripe isn't configured.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { reference } = await params;
  try {
    await devConfirmBooking(reference, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof BookingError) {
      const status = e.code === "NOT_FOUND" ? 404 : 403;
      return NextResponse.json({ error: e.message }, { status });
    }
    return NextResponse.json({ error: "Failed to confirm" }, { status: 500 });
  }
}
