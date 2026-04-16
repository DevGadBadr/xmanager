import Link from "next/link";
import { redirect } from "next/navigation";

import { PasswordResetFlow } from "@/components/forms/password-reset-flow";
import { AppLogo } from "@/components/shared/app-logo";
import { SignInForm } from "@/components/forms/sign-in-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentMembership } from "@/modules/auth/server";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const membership = await getCurrentMembership();

  if (membership) {
    redirect("/dashboard");
  }

  const { callbackUrl, error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-3">
          <AppLogo imageClassName="h-9 w-auto" />
          <CardTitle>Sign in to Flow</CardTitle>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Use the email and password you created from your workspace invite, or sign in with a
            Google account you already linked from your profile.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <SignInForm callbackUrl={callbackUrl || "/dashboard"} initialError={error} />
          <PasswordResetFlow
            dialogTriggerLabel="Forgot password?"
            description="We’ll send a one-time reset code to the invited email tied to your workspace account."
            title="Recover your password"
          />
          <Button asChild className="w-full" variant="ghost">
            <Link href="/">Back to home</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
