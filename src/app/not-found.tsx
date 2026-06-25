import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container-page flex min-h-dvh flex-col items-center justify-center py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Compass className="size-6" aria-hidden />
      </span>
      <h1 className="mt-6 font-serif text-4xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        The page you&apos;re looking for has wandered off. Let&apos;s get you back on the map.
      </p>
      <div className="mt-6 flex gap-2">
        <Button asChild><Link href="/">Go home</Link></Button>
        <Button asChild variant="outline"><Link href="/hotels">Browse hotels</Link></Button>
      </div>
    </main>
  );
}
