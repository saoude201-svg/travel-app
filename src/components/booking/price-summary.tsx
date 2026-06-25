import Image from "next/image";
import { CalendarRange, BedDouble, Users } from "lucide-react";
import { formatCurrency, formatDateRange } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export interface PriceSummaryProps {
  hotelName: string;
  roomName: string;
  image: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  rooms: number;
  guests: number;
  roomSubtotalCents: number;
  taxesCents: number;
  feesCents: number;
  totalCents: number;
}

export function PriceSummary(p: PriceSummaryProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg">
          <Image src={p.image} alt="" fill sizes="80px" className="object-cover" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{p.hotelName}</h2>
          <p className="text-sm text-muted-foreground">{p.roomName}</p>
        </div>
      </div>

      <Separator className="my-4" />

      <dl className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarRange className="size-4" aria-hidden />
          {formatDateRange(p.checkIn, p.checkOut)} · {p.nights} night{p.nights === 1 ? "" : "s"}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <BedDouble className="size-4" aria-hidden /> {p.rooms} room{p.rooms === 1 ? "" : "s"}
          <span className="mx-1">·</span>
          <Users className="size-4" aria-hidden /> {p.guests} guest{p.guests === 1 ? "" : "s"}
        </div>
      </dl>

      <Separator className="my-4" />

      <dl className="space-y-2 text-sm">
        <Row label={`Room (${p.nights} × ${p.rooms})`} value={p.roomSubtotalCents} />
        <Row label="Taxes" value={p.taxesCents} />
        <Row label="Service fee" value={p.feesCents} />
      </dl>
      <Separator className="my-3" />
      <div className="flex items-center justify-between text-base font-semibold">
        <span>Total</span>
        <span>{formatCurrency(p.totalCents)}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Charged in USD.</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{formatCurrency(value)}</dd>
    </div>
  );
}
