import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Returns the current session user or null. */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Requires a signed-in user; redirects to /signin otherwise. */
export async function requireUser(callbackUrl = "/trips") {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return user;
}

/** Requires an ADMIN user; redirects home otherwise. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?callbackUrl=/admin");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
