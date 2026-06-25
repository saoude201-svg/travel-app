import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/booking/booking-status";

export const metadata: Metadata = { title: "Admin · Bookings", robots: { index: false } };

const STATUSES = ["ALL", "PENDING", "CONFIRMED", "CANCELLED", "FAILED"] as const;
type StatusFilter = (typeof STATUSES)[number];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter: StatusFilter = STATUSES.includes(status as StatusFilter)
    ? (status as StatusFilter)
    : "ALL";

  const [grouped, revenue, bookings] = await Promise.all([
    db.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    db.booking.aggregate({ where: { status: "CONFIRMED" }, _sum: { totalCents: true } }),
    db.booking.findMany({
      where: filter === "ALL" ? {} : { status: filter },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { hotel: { include: { destination: true } }, user: true },
    }),
  ]);

  const countFor = (s: string) => grouped.find((g) => g.status === s)?._count._all ?? 0;
  const total = grouped.reduce((sum, g) => sum + g._count._all, 0);

  const stats = [
    { label: "Total bookings", value: String(total) },
    { label: "Confirmed", value: String(countFor("CONFIRMED")) },
    { label: "Pending", value: String(countFor("PENDING")) },
    { label: "Confirmed revenue", value: formatCurrency(revenue._sum.totalCents ?? 0) },
  ];

  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Admin · Bookings</h1>
        <p className="mt-1 text-muted-foreground">Operational view of all bookings.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-2xl font-semibold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={s === "ALL" ? "/admin" : `/admin?status=${s}`}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                filter === s ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary"
              }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </Link>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/40 text-left">
              <tr>
                <Th>Reference</Th>
                <Th>Guest</Th>
                <Th>Hotel</Th>
                <Th>Dates</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th>Booked</Th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    No bookings for this filter.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-secondary/20">
                    <Td className="font-mono">
                      <Link href={`/trips/${b.reference}`} className="hover:underline">{b.reference}</Link>
                    </Td>
                    <Td>
                      <span className="block">{b.guestFirstName} {b.guestLastName}</span>
                      <span className="block text-xs text-muted-foreground">{b.user.email}</span>
                    </Td>
                    <Td>
                      <span className="block">{b.hotel.name}</span>
                      <span className="block text-xs text-muted-foreground">{b.hotel.destination.name}</span>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {b.checkIn.toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
                      {b.checkOut.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </Td>
                    <Td>{formatCurrency(b.totalCents)}</Td>
                    <Td><BookingStatusBadge status={b.status} /></Td>
                    <Td className="whitespace-nowrap text-muted-foreground">
                      {b.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className ?? ""}`}>{children}</td>;
}
