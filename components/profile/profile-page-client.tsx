"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  Camera,
  Image as ImageIcon,
  KeyRound,
  Link2,
  Mail,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PasswordResetFlow } from "@/components/forms/password-reset-flow";
import { GoogleSignInButton } from "@/components/shared/google-sign-in-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { initialActionState, type ActionState } from "@/lib/action-state";
import { formatDate, getInitials, resolveAppAssetUrl } from "@/lib/utils";
import { DEPARTMENT_OPTIONS } from "@/modules/invitations/schemas";
import {
  importGoogleAvatarAction,
  removeAvatarAction,
  saveAvatarUrlAction,
  unlinkGoogleAction,
  updateProfileAction,
  uploadAvatarAction,
} from "@/modules/profile/actions";

type ProfilePageClientProps = {
  hasGoogleAccount: boolean;
  hasPassword: boolean;
  initialFeedback?: {
    kind: "error" | "success";
    message: string;
  } | null;
  membership: {
    joinedAt: Date | string;
    role: string;
    teamNames: string[];
    workspaceName: string;
  };
  user: {
    createdAt: Date | string;
    department: string | null;
    email: string;
    fullName: string;
    googleImage: string | null;
    id: string;
    image: string | null;
    lastActiveAt: Date | string | null;
    title: string;
  };
};

function useActionFeedback(state: ActionState, onSuccess?: () => void) {
  const handledStateRef = useRef<string | null>(null);

  useEffect(() => {
    const stateKey = `${state.status}:${state.message ?? ""}`;

    if (state.status === "idle" || handledStateRef.current === stateKey) {
      return;
    }

    handledStateRef.current = stateKey;

    if (state.status === "success") {
      if (state.message) {
        toast.success(state.message);
      }

      onSuccess?.();
      return;
    }

    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [onSuccess, state.message, state.status]);
}

export function ProfilePageClient({
  hasGoogleAccount,
  hasPassword,
  initialFeedback,
  membership,
  user,
}: ProfilePageClientProps) {
  const router = useRouter();
  const imageSrc = resolveAppAssetUrl(user.image);
  const initials = getInitials(user.fullName || user.email);
  const uploadFormRef = useRef<HTMLFormElement>(null);
  const externalAvatarValue = user.image && !user.image.startsWith("/uploads/") ? user.image : "";
  const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, initialActionState);
  const [avatarUrlState, avatarUrlAction, avatarUrlPending] = useActionState(
    saveAvatarUrlAction,
    initialActionState,
  );
  const [avatarUploadState, avatarUploadAction, avatarUploadPending] = useActionState(
    uploadAvatarAction,
    initialActionState,
  );
  const [removeAvatarState, removeAvatarFormAction, removeAvatarPending] = useActionState(
    removeAvatarAction,
    initialActionState,
  );
  const [googleAvatarState, googleAvatarAction, googleAvatarPending] = useActionState(
    importGoogleAvatarAction,
    initialActionState,
  );
  const [unlinkGoogleState, unlinkGoogleFormAction, unlinkGooglePending] = useActionState(
    unlinkGoogleAction,
    initialActionState,
  );

  useEffect(() => {
    if (!initialFeedback) {
      return;
    }

    if (initialFeedback.kind === "error") {
      toast.error(initialFeedback.message);
      return;
    }

    toast.success(initialFeedback.message);
  }, [initialFeedback]);

  useActionFeedback(profileState, () => router.refresh());
  useActionFeedback(avatarUrlState, () => router.refresh());
  useActionFeedback(avatarUploadState, () => {
    uploadFormRef.current?.reset();
    router.refresh();
  });
  useActionFeedback(removeAvatarState, () => router.refresh());
  useActionFeedback(googleAvatarState, () => router.refresh());
  useActionFeedback(unlinkGoogleState, () => router.refresh());

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-sky-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.25),_transparent_42%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(240,249,255,0.92)_42%,_rgba(226,232,240,0.84)_100%)] p-6 shadow-sm dark:border-sky-500/20 dark:bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.28),_transparent_40%),linear-gradient(135deg,_rgba(9,14,24,0.98),_rgba(15,23,42,0.96)_45%,_rgba(17,24,39,0.92)_100%)] sm:p-7">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,_rgba(14,165,233,0.16),_transparent_62%)] lg:block" />
        <div className="relative grid gap-6 lg:grid-cols-[auto,1fr] lg:items-center">
          <Avatar className="h-24 w-24 border border-white/70 shadow-lg shadow-sky-900/10 dark:border-zinc-900/60 dark:shadow-none">
            <AvatarImage alt={user.fullName || user.email} src={imageSrc} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">{membership.role}</Badge>
                <Badge variant="neutral">{membership.workspaceName}</Badge>
                {hasGoogleAccount ? <Badge variant="success">Google linked</Badge> : null}
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">
                  {user.fullName || user.email}
                </h1>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  {user.title || "Add your title"} • {user.department || "Choose your department"}
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <HeroMetric icon={<Mail className="h-4 w-4" />} label="Invited email" value={user.email} />
              <HeroMetric
                icon={<CalendarClock className="h-4 w-4" />}
                label="Joined workspace"
                value={formatDate(membership.joinedAt)}
              />
              <HeroMetric
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Last active"
                value={formatDate(user.lastActiveAt)}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr,0.95fr]">
        <Card className="rounded-[1.75rem]">
          <CardHeader>
            <CardTitle>Personal details</CardTitle>
            <CardDescription>
              Your email stays fixed to the invited workspace account. Everything else here is yours to
              maintain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                startTransition(() => profileAction(formData));
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-full-name">Full name</Label>
                  <Input
                    defaultValue={user.fullName}
                    disabled={profilePending}
                    id="profile-full-name"
                    name="fullName"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-title">Title</Label>
                  <Input
                    defaultValue={user.title}
                    disabled={profilePending}
                    id="profile-title"
                    name="title"
                    placeholder="Project Manager"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-department">Department</Label>
                  <Select
                    defaultValue={user.department ?? DEPARTMENT_OPTIONS[0]}
                    disabled={profilePending}
                    id="profile-department"
                    name="department"
                  >
                    {DEPARTMENT_OPTIONS.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email">Invited email</Label>
                  <Input disabled id="profile-email" value={user.email} />
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300">
                Email is locked to the workspace invite so access, notifications, and sign-in methods stay
                tied to the same identity.
              </div>
              <div className="flex justify-end">
                <Button disabled={profilePending} type="submit">
                  <BadgeCheck className="h-4 w-4" />
                  {profilePending ? "Saving..." : "Save details"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[1.75rem]">
            <CardHeader>
              <CardTitle>Avatar</CardTitle>
              <CardDescription>Upload an image, paste a URL, or pull your Google photo in.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4 rounded-2xl border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
                <Avatar className="h-16 w-16">
                  <AvatarImage alt={user.fullName || user.email} src={imageSrc} />
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">Current profile image</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Upload wins over initials. External URLs and Google photos stay supported too.
                  </p>
                </div>
              </div>

              <form
                ref={uploadFormRef}
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  startTransition(() => avatarUploadAction(formData));
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="profile-avatar-upload">Upload avatar</Label>
                  <Input
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    disabled={avatarUploadPending}
                    id="profile-avatar-upload"
                    name="avatar"
                    type="file"
                  />
                </div>
                <Button className="w-full" disabled={avatarUploadPending} type="submit" variant="outline">
                  <Upload className="h-4 w-4" />
                  {avatarUploadPending ? "Uploading..." : "Upload image"}
                </Button>
              </form>

              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  startTransition(() => avatarUrlAction(formData));
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="profile-avatar-url">Avatar URL</Label>
                  <Input
                    defaultValue={externalAvatarValue}
                    disabled={avatarUrlPending}
                    id="profile-avatar-url"
                    name="avatarUrl"
                    placeholder="https://example.com/avatar.jpg"
                    type="url"
                  />
                </div>
                <Button className="w-full" disabled={avatarUrlPending} type="submit" variant="outline">
                  <Link2 className="h-4 w-4" />
                  {avatarUrlPending ? "Saving URL..." : "Save avatar URL"}
                </Button>
              </form>

              <div className="grid gap-2 sm:grid-cols-2">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    startTransition(() => googleAvatarAction(formData));
                  }}
                >
                  <Button
                    className="w-full"
                    disabled={!hasGoogleAccount || !user.googleImage || googleAvatarPending}
                    type="submit"
                    variant="secondary"
                  >
                    <Sparkles className="h-4 w-4" />
                    {googleAvatarPending ? "Applying..." : "Use Google photo"}
                  </Button>
                </form>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    startTransition(() => removeAvatarFormAction(formData));
                  }}
                >
                  <Button className="w-full" disabled={removeAvatarPending} type="submit" variant="ghost">
                    <Camera className="h-4 w-4" />
                    {removeAvatarPending ? "Removing..." : "Remove avatar"}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem]">
            <CardHeader>
              <CardTitle>Workspace access</CardTitle>
              <CardDescription>Read-only account context from your current workspace membership.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow icon={<BriefcaseBusiness className="h-4 w-4" />} label="Workspace" value={membership.workspaceName} />
              <InfoRow icon={<ShieldCheck className="h-4 w-4" />} label="Role" value={membership.role} />
              <InfoRow
                icon={<UserRound className="h-4 w-4" />}
                label="Teams"
                value={membership.teamNames.length > 0 ? membership.teamNames.join(", ") : "No team assignments yet"}
              />
              <InfoRow icon={<CalendarClock className="h-4 w-4" />} label="Member since" value={formatDate(membership.joinedAt)} />
              <InfoRow icon={<ImageIcon className="h-4 w-4" />} label="Account created" value={formatDate(user.createdAt)} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-[1.75rem]">
        <CardHeader>
          <CardTitle>Security and sign-in</CardTitle>
          <CardDescription>
            Manage how this invite-bound account is protected and which sign-in methods remain attached to it.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1fr,0.92fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <MethodCard
                description={
                  hasPassword
                    ? "Email and password sign-in is active for this invited account."
                    : "No password is set yet. Use the reset flow to add one."
                }
                status={hasPassword ? "Active" : "Needs setup"}
                title="Email password"
                variant={hasPassword ? "success" : "warning"}
              />
              <MethodCard
                description={
                  hasGoogleAccount
                    ? "Google sign-in is linked to the same invited email."
                    : "Link Google if you want OAuth sign-in in addition to email and password."
                }
                status={hasGoogleAccount ? "Linked" : "Not linked"}
                title="Google"
                variant={hasGoogleAccount ? "success" : "neutral"}
              />
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">Google sign-in</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Only the exact invited email can be linked. A different Google email will be rejected.
                  </p>
                </div>
                {hasGoogleAccount ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      const formData = new FormData(event.currentTarget);
                      startTransition(() => unlinkGoogleFormAction(formData));
                    }}
                  >
                    <Button disabled={unlinkGooglePending} type="submit" variant="outline">
                      {unlinkGooglePending ? "Removing..." : "Unlink Google"}
                    </Button>
                  </form>
                ) : (
                  <GoogleSignInButton
                    busyLabel="Redirecting to Google..."
                    callbackUrl="/profile?google=linked"
                    label="Link Google"
                    variant="outline"
                  />
                )}
              </div>
            </div>

            {!hasGoogleAccount ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Google sign-in will only become available on the sign-in page after you link it here first.
              </p>
            ) : null}
            {hasGoogleAccount && !hasPassword ? (
              <p className="text-sm text-amber-600 dark:text-amber-300">
                Set an email password before unlinking Google so this account is never left without a sign-in method.
              </p>
            ) : null}
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Returning to sign-in with Google later will continue using{" "}
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{user.email}</span>.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-sky-200/70 bg-[linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(239,246,255,0.92))] p-5 dark:border-sky-500/20 dark:bg-[linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(12,18,30,0.92))]">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-sky-700 dark:text-sky-200">
              <KeyRound className="h-4 w-4" />
              Password recovery
            </div>
            <PasswordResetFlow
              description="Send a six-digit code to your invited email, then choose a new password for this account."
              fixedEmail={user.email}
              title="Reset your password"
            />
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              The same recovery flow is also available from{" "}
              <Link className="font-medium text-sky-600 dark:text-sky-300" href="/auth/signin">
                sign in
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HeroMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/55">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-400">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="mt-0.5 rounded-full bg-white p-2 text-sky-600 shadow-sm dark:bg-zinc-900 dark:text-sky-300">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">{label}</p>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{value}</p>
      </div>
    </div>
  );
}

function MethodCard({
  description,
  status,
  title,
  variant,
}: {
  description: string;
  status: string;
  title: string;
  variant: "neutral" | "success" | "warning";
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</p>
        <Badge variant={variant}>{status}</Badge>
      </div>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
    </div>
  );
}
