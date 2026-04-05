"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { z } from "zod";

import { GoogleSignInButton } from "@/components/shared/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { credentialsSignInSchema } from "@/modules/auth/schemas";

type SignInValues = z.infer<typeof credentialsSignInSchema>;

function getErrorMessage(error?: string | null) {
  if (!error) {
    return null;
  }

  if (error === "CredentialsSignin") {
    return "Invalid email or password.";
  }

  if (error === "AccessDenied") {
    return "This email does not have access yet. Use your invitation email first.";
  }

  if (error === "OAuthAccountNotLinked") {
    return "Google is not linked for this account yet. Sign in with email first, then link Google from your profile.";
  }

  return "Unable to sign in right now.";
}

export function SignInForm({
  callbackUrl,
  initialError,
}: {
  callbackUrl: string;
  initialError?: string;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(getErrorMessage(initialError));
  const [pendingMethod, setPendingMethod] = useState<"credentials" | "google" | null>(null);
  const form = useForm<SignInValues>({
    resolver: zodResolver(credentialsSignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const isBusy = pendingMethod !== null;

  return (
    <form
      aria-busy={isBusy}
      className="space-y-5"
      onSubmit={form.handleSubmit(async (values) => {
        setPendingMethod("credentials");
        setErrorMessage(null);

        try {
          const result = await signIn("credentials", {
            email: values.email,
            password: values.password,
            callbackUrl,
            redirect: false,
          });

          if (!result || result.error) {
            setPendingMethod(null);
            setErrorMessage(getErrorMessage(result?.error) ?? "Unable to sign in right now.");
            return;
          }

          window.location.assign(result.url ?? callbackUrl);
        } catch {
          setPendingMethod(null);
          setErrorMessage("Unable to sign in right now.");
        }
      })}
    >
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          autoComplete="email"
          disabled={isBusy}
          id="signin-email"
          placeholder="member@example.com"
          {...form.register("email")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <Input
          autoComplete="current-password"
          disabled={isBusy}
          id="signin-password"
          type="password"
          {...form.register("password")}
        />
      </div>
      {errorMessage ? <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p> : null}
      <Button className="w-full" disabled={isBusy} type="submit">
        {pendingMethod === "credentials" ? "Signing in..." : "Sign in with email"}
      </Button>
      <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Google is optional and only works when it uses the same invited email.
        </p>
        {pendingMethod === "google" ? (
          <p className="text-sm text-sky-600 dark:text-sky-300">
            Redirecting to Google. Please wait...
          </p>
        ) : null}
        <GoogleSignInButton
          busyLabel="Redirecting to Google..."
          callbackUrl={callbackUrl}
          className="w-full"
          disabled={isBusy}
          onPendingChange={(pending) => setPendingMethod(pending ? "google" : null)}
          variant="outline"
        />
      </div>
    </form>
  );
}
