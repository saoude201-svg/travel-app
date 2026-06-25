import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cancelBooking, BookingError } from "@/server/booking";

export const runtime = "nodejs";

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
    const result = await cancelBooking(reference, session.user.id);
    return NextResponse.json({ ok: true, refundCents: result.refundCents });
  } catch (e) {
    if (e instanceof BookingError) {
      const status = e.code === "NOT_FOUND" ? 404 : e.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json({ error: e.message }, { status });
    }
    console.error("Cancellation failed:", e);
    return NextResponse.json({ error: "Could not cancel booking." }, { status: 500 });
  }
}
