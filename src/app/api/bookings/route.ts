import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createBookingSchema } from "@/lib/validations/booking";
import { createBooking, BookingError } from "@/server/booking";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in to book." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid booking details", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const result = await createBooking(parsed.data, session.user.id);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof BookingError) {
      const status = e.code === "UNAVAILABLE" ? 409 : e.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    console.error("Booking creation failed:", e);
    return NextResponse.json({ error: "Could not create booking. Please try again." }, { status: 500 });
  }
}
