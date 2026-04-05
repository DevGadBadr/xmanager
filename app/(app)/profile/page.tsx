import { ProfilePageClient } from "@/components/profile/profile-page-client";
import { requireCurrentMembership } from "@/modules/auth/server";
import { getProfilePageData } from "@/modules/profile/service";

export const dynamic = "force-dynamic";

function getInitialFeedback(searchParams: { error?: string; google?: string }) {
  if (searchParams.google === "linked") {
    return {
      kind: "success" as const,
      message: "Google sign-in linked to this account.",
    };
  }

  if (searchParams.error === "google-account-conflict") {
    return {
      kind: "error" as const,
      message: "That Google account is already linked to another XManager user. Sign out and log in with Google instead.",
    };
  }

  return null;
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; google?: string }>;
}) {
  const membership = await requireCurrentMembership();
  const profile = await getProfilePageData(membership.userId, membership.workspaceId);
  const resolvedSearchParams = await searchParams;

  return (
    <ProfilePageClient
      hasGoogleAccount={profile.hasGoogleAccount}
      hasPassword={profile.hasPassword}
      initialFeedback={getInitialFeedback(resolvedSearchParams)}
      membership={profile.membership}
      user={profile.user}
    />
  );
}
