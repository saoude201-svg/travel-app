import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Compass } from "lucide-react";
import { brand } from "@/design/tokens";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Create account" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  if (await getCurrentUser()) redirect(callbackUrl || "/trips");

  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  return (
    <main className="container-page flex min-h-dvh flex-col items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-semibold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Compass className="size-5" aria-hidden />
          </span>
          <span className="font-serif text-xl">{brand.name}</span>
        </Link>
        <h1 className="text-center text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mb-6 mt-1 text-center text-sm text-muted-foreground">
          Start planning trips in under a minute.
        </p>
        <AuthForm mode="signup" callbackUrl={callbackUrl} googleEnabled={googleEnabled} />
      </div>
    </main>
  );
}
