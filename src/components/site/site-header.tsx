import Link from "next/link";
import { Compass } from "lucide-react";
import { brand } from "@/design/tokens";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/site/user-menu";
import { getCurrentUser } from "@/lib/session";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const account = user ? (
    <UserMenu name={user.name} email={user.email} image={user.image} role={user.role} />
  ) : null;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Compass className="size-5" aria-hidden />
          </span>
          <span className="font-serif text-lg tracking-tight">{brand.name}</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/suggestions" className="transition-colors hover:text-foreground">
            AI Trip Planner
          </Link>
          <Link href="/hotels" className="transition-colors hover:text-foreground">
            Hotels
          </Link>
          <Link href="/destinations" className="transition-colors hover:text-foreground">
            Destinations
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {account ?? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/signin">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
