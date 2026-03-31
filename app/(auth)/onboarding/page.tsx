import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/forms/onboarding-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getCurrentMembership } from "@/modules/auth/server";
import { getInvitationByToken } from "@/modules/invitations/service";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await auth();
  const existingMembership = await getCurrentMembership();

  if (existingMembership) {
    redirect("/dashboard");
  }

  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Missing onboarding token</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-500 dark:text-zinc-400">
            Reopen the original invitation email to continue.
          </CardContent>
        </Card>
      </main>
    );
  }

  const invitation = await getInvitationByToken(token);

  if (!invitation || invitation.status !== "PENDING") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Invitation unavailable</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-500 dark:text-zinc-400">
            Your invitation is no longer available. Ask an administrator for a new invite.
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Complete your profile</CardTitle>
        </CardHeader>
        <CardContent>
          <OnboardingForm
            defaultEmail={invitation.email}
            defaultName={session?.user?.email?.trim().toLowerCase() === invitation.email ? session.user.name : null}
            token={token}
          />
        </CardContent>
      </Card>
    </main>
  );
}
