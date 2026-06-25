"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  authenticate,
  register,
  signInWithGoogle,
  type AuthFormState,
} from "@/server/auth-actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {label}
    </Button>
  );
}

export function AuthForm({
  mode,
  callbackUrl = "/trips",
  googleEnabled,
}: {
  mode: "signin" | "signup";
  callbackUrl?: string;
  googleEnabled: boolean;
}) {
  const action = mode === "signin" ? authenticate : register;
  const [state, formAction] = useActionState<AuthFormState, FormData>(action, {});

  return (
    <div className="space-y-5">
      {googleEnabled ? (
        <>
          <form action={signInWithGoogle.bind(null, callbackUrl)}>
            <Button type="submit" variant="outline" className="w-full">
              Continue with Google
            </Button>
          </form>
          <div className="relative text-center text-xs text-muted-foreground">
            <span className="relative z-10 bg-background px-2">or</span>
            <span className="absolute inset-x-0 top-1/2 -z-0 h-px bg-border" />
          </div>
        </>
      ) : null}

      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        {mode === "signup" ? (
          <Field
            id="name"
            name="name"
            label="Full name"
            type="text"
            autoComplete="name"
            error={state.fieldErrors?.name}
          />
        ) : null}

        <Field
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={state.fieldErrors?.email}
        />
        <Field
          id="password"
          name="password"
          label="Password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          error={state.fieldErrors?.password}
        />

        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        <SubmitButton label={mode === "signin" ? "Sign in" : "Create account"} />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "signin" ? (
          <>
            New here?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/signin" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function Field({
  id,
  name,
  label,
  type,
  autoComplete,
  error,
}: {
  id: string;
  name: string;
  label: string;
  type: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        required
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
