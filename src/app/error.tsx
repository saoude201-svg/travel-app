"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container-page flex min-h-dvh flex-col items-center justify-center py-16 text-center">
      <AlertTriangle className="size-10 text-destructive" aria-hidden />
      <h1 className="mt-6 font-serif text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        We hit an unexpected error. Please try again — if it keeps happening, come back in a moment.
      </p>
      <Button className="mt-6" onClick={reset}>Try again</Button>
    </main>
  );
}
