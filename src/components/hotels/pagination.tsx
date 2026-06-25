import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function Pagination({
  page,
  pageSize,
  total,
  baseQuery,
}: {
  page: number;
  pageSize: number;
  total: number;
  /** Current query string WITHOUT the page param. */
  baseQuery: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => {
    const q = new URLSearchParams(baseQuery);
    if (p > 1) q.set("page", String(p));
    else q.delete("page");
    return `/hotels?${q.toString()}`;
  };

  // Window of pages around the current one.
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <PageLink href={hrefFor(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <ChevronLeft className="size-4" aria-hidden />
      </PageLink>
      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            buttonVariants({ variant: p === page ? "default" : "outline", size: "icon" }),
            "size-9",
          )}
        >
          {p}
        </Link>
      ))}
      <PageLink href={hrefFor(page + 1)} disabled={page >= totalPages} aria-label="Next page">
        <ChevronRight className="size-4" aria-hidden />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  children,
  ...props
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
} & React.ComponentProps<typeof Link>) {
  if (disabled) {
    return (
      <span
        aria-disabled
        className={cn(buttonVariants({ variant: "outline", size: "icon" }), "size-9 opacity-50")}
      >
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={cn(buttonVariants({ variant: "outline", size: "icon" }), "size-9")} {...props}>
      {children}
    </Link>
  );
}
