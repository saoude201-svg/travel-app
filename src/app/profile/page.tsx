import type { Metadata } from "next";
import { Mail, Shield, User as UserIcon } from "lucide-react";
import { requireUser } from "@/lib/session";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser("/profile");

  return (
    <>
      <SiteHeader />
      <main className="container-page max-w-2xl py-12">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-muted-foreground">Your account details.</p>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="size-5 text-primary" aria-hidden />
              {user.name ?? "Traveler"}
              {user.role === "ADMIN" ? (
                <Badge variant="accent" className="ml-2 gap-1">
                  <Shield className="size-3" aria-hidden /> Admin
                </Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="size-4" aria-hidden /> {user.email}
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
