import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site/site-header";

export default function HotelsLoading() {
  return (
    <>
      <SiteHeader />
      <main className="container-page py-8">
        <Skeleton className="mb-6 h-9 w-64" />
        <Skeleton className="mb-8 h-28 w-full rounded-xl" />
        <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
          <div className="hidden space-y-4 lg:block">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
