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
  const [pending, setPending] = useState(false);
  const form = useForm<SignInValues>({
    resolver: zodResolver(credentialsSignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit(async (values) => {
        setPending(true);
        setErrorMessage(null);

        const result = await signIn("credentials", {
          email: values.email,
          password: values.password,
          callbackUrl,
          redirect: false,
        });

        setPending(false);

        if (!result || result.error) {
          setErrorMessage(getErrorMessage(result?.error) ?? "Unable to sign in right now.");
          return;
        }

        window.location.assign(result.url ?? callbackUrl);
      })}
    >
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          autoComplete="email"
          id="signin-email"
          placeholder="member@example.com"
          {...form.register("email")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <Input
          autoComplete="current-password"
          id="signin-password"
          type="password"
          {...form.register("password")}
        />
      </div>
      {errorMessage ? <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p> : null}
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Signing in..." : "Sign in with email"}
      </Button>
      <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Google is optional and only works when it uses the same invited email.
        </p>
        <GoogleSignInButton callbackUrl={callbackUrl} className="w-full" variant="outline" />
      </div>
    </form>
  );
}
