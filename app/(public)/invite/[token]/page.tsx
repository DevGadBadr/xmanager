import Link from "next/link";
import { redirect } from "next/navigation";

import { GoogleSignInButton } from "@/components/shared/google-sign-in-button";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getInvitationByToken } from "@/modules/invitations/service";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Invite not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              This invitation token is invalid or has already been removed.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (invitation.status !== "PENDING") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Invitation unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              This invitation is {invitation.status.toLowerCase()}.
            </p>
            <Button asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const session = await auth();
  const sessionEmail = session?.user?.email?.trim().toLowerCase();

  if (!sessionEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Accept your invitation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              This invite is reserved for <strong>{invitation.email}</strong>. Create your account
              with that email, then use it as your primary sign-in going forward.
            </p>
            <Button asChild className="w-full">
              <Link href={`/onboarding?token=${token}`}>Continue with invited email</Link>
            </Button>
            <GoogleSignInButton
              callbackUrl={`/invite/${token}`}
              className="w-full"
              label="Continue with Google instead"
              variant="outline"
            />
          </CardContent>
        </Card>
      </main>
    );
  }

  if (sessionEmail !== invitation.email) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Email mismatch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              This invite is for <strong>{invitation.email}</strong>, but you are signed in as{" "}
              <strong>{sessionEmail}</strong>.
            </p>
            <Button asChild className="w-full">
              <Link href={`/onboarding?token=${token}`}>Continue with invited email</Link>
            </Button>
            <SignOutButton className="w-full" variant="outline" />
          </CardContent>
        </Card>
      </main>
    );
  }

  redirect(`/onboarding?token=${token}`);
}
