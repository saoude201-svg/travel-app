import { Badge } from "@/components/ui/badge";

type Status = "PENDING" | "CONFIRMED" | "CANCELLED" | "FAILED";

const MAP: Record<Status, { label: string; variant: "default" | "success" | "secondary" | "destructive" }> = {
  PENDING: { label: "Pending", variant: "secondary" },
  CONFIRMED: { label: "Confirmed", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "secondary" },
  FAILED: { label: "Payment failed", variant: "destructive" },
};

export function BookingStatusBadge({ status }: { status: Status }) {
  const s = MAP[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
