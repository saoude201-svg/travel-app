import Link from "next/link";
import { brand } from "@/design/tokens";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-secondary/30">
      <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-sm space-y-2">
          <p className="font-serif text-lg">{brand.name}</p>
          <p className="text-sm text-muted-foreground">
            AI-crafted trip ideas and a calm way to book the stay. Built as a
            reference product — not a live seller of travel.
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm text-muted-foreground">
          <Link href="/suggestions" className="hover:text-foreground">Plan a trip</Link>
          <Link href="/hotels" className="hover:text-foreground">Find hotels</Link>
          <Link href="/destinations" className="hover:text-foreground">Destinations</Link>
          <Link href="/trips" className="hover:text-foreground">My trips</Link>
        </nav>
      </div>
      <div className="border-t py-4">
        <p className="container-page text-xs text-muted-foreground">
          © {new Date().getFullYear()} {brand.name}. Demo data via mock hotel
          provider.
        </p>
      </div>
    </footer>
  );
}
