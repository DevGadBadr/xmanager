"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  Camera,
  CheckCircle2,
  CircleAlert,
  Info,
  Image as ImageIcon,
  KeyRound,
  Link2,
  LoaderCircle,
  Mail,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PasswordResetFlow } from "@/components/forms/password-reset-flow";
import { GoogleSignInButton } from "@/components/shared/google-sign-in-button";
import { AVATAR_UPLOAD_ACCEPT, MAX_AVATAR_FILE_SIZE, validateAvatarUploadFile } from "@/lib/avatar-rules";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { initialActionState, type ActionState } from "@/lib/action-state";
import { cn, formatDate, getInitials, resolveAppAssetUrl } from "@/lib/utils";
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

type AvatarOperation = "idle" | "upload" | "url" | "google" | "remove";
type AvatarSource = "uploaded" | "external" | "google" | "none";

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
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const avatarPreviewUrlRef = useRef<string | null>(null);
  const externalAvatarValue = user.image && !user.image.startsWith("/uploads/") ? user.image : "";
  const [avatarOperation, setAvatarOperation] = useState<AvatarOperation>("idle");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [selectedAvatarError, setSelectedAvatarError] = useState<string | null>(null);
  const [selectedAvatarPreviewUrl, setSelectedAvatarPreviewUrl] = useState<string | null>(null);
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
  const currentAvatarSource = getAvatarSource(user.image, user.googleImage);
  const avatarPreviewImageSrc = selectedAvatarPreviewUrl ?? imageSrc;
  const avatarStatus = getAvatarStatus({
    avatarOperation,
    avatarUploadPending,
    avatarUploadState,
    avatarUrlPending,
    avatarUrlState,
    currentAvatarSource,
    googleAvatarPending,
    googleAvatarState,
    removeAvatarPending,
    removeAvatarState,
    selectedAvatarError,
    selectedAvatarFile,
  });

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

  useEffect(() => {
    return () => {
      if (avatarPreviewUrlRef.current) {
        URL.revokeObjectURL(avatarPreviewUrlRef.current);
      }
    };
  }, []);

  const clearSelectedAvatar = () => {
    if (avatarPreviewUrlRef.current) {
      URL.revokeObjectURL(avatarPreviewUrlRef.current);
      avatarPreviewUrlRef.current = null;
    }

    setSelectedAvatarFile(null);
    setSelectedAvatarError(null);
    setSelectedAvatarPreviewUrl(null);

    if (avatarFileInputRef.current) {
      avatarFileInputRef.current.value = "";
    }
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;

    setAvatarOperation("upload");

    if (!file) {
      clearSelectedAvatar();
      return;
    }

    const validationError = validateAvatarUploadFile(file);

    if (validationError) {
      if (avatarPreviewUrlRef.current) {
        URL.revokeObjectURL(avatarPreviewUrlRef.current);
        avatarPreviewUrlRef.current = null;
      }

      setSelectedAvatarFile(null);
      setSelectedAvatarError(validationError);
      setSelectedAvatarPreviewUrl(null);
      event.currentTarget.value = "";
      return;
    }

    if (avatarPreviewUrlRef.current) {
      URL.revokeObjectURL(avatarPreviewUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);

    avatarPreviewUrlRef.current = objectUrl;
    setSelectedAvatarFile(file);
    setSelectedAvatarError(null);
    setSelectedAvatarPreviewUrl(objectUrl);
  };

  useActionFeedback(profileState, () => router.refresh());
  useActionFeedback(avatarUrlState, () => router.refresh());
  useActionFeedback(avatarUploadState, () => {
    uploadFormRef.current?.reset();
    clearSelectedAvatar();
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
              <div className="space-y-3 rounded-2xl border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Avatar className="h-16 w-16">
                    <AvatarImage alt={user.fullName || user.email} src={imageSrc} />
                    <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">Current profile image</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Source: <span className="font-medium text-zinc-700 dark:text-zinc-200">{currentAvatarSource.label}</span>
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{currentAvatarSource.description}</p>
                  </div>
                  <div className="rounded-2xl border border-dashed border-zinc-300/80 bg-white/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/70">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage alt="Selected avatar preview" src={avatarPreviewImageSrc} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Preview</p>
                        <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                          {selectedAvatarFile ? "Selected image" : "Current avatar"}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {selectedAvatarFile ? "This is what will be applied after upload." : "Pick a file to preview it here."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="neutral">{currentAvatarSource.badge}</Badge>
                  <Badge variant="neutral">Max {formatFileSize(MAX_AVATAR_FILE_SIZE)}</Badge>
                  <Badge variant="neutral">PNG, JPG, WEBP, GIF</Badge>
                </div>
              </div>

              <AvatarFlowStatusCard
                description={avatarStatus.description}
                title={avatarStatus.title}
                tone={avatarStatus.tone}
              />

              <form
                ref={uploadFormRef}
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();

                  setAvatarOperation("upload");

                  if (!selectedAvatarFile) {
                    setSelectedAvatarError("Choose an image before uploading.");
                    return;
                  }

                  if (selectedAvatarError) {
                    return;
                  }

                  const formData = new FormData(event.currentTarget);
                  startTransition(() => avatarUploadAction(formData));
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="profile-avatar-upload">Upload avatar</Label>
                  <Input
                    accept={AVATAR_UPLOAD_ACCEPT}
                    disabled={avatarUploadPending}
                    id="profile-avatar-upload"
                    name="avatar"
                    onChange={handleAvatarFileChange}
                    ref={avatarFileInputRef}
                    type="file"
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Choose a square or near-square image for the cleanest crop. Files stay capped at{" "}
                    {formatFileSize(MAX_AVATAR_FILE_SIZE)}.
                  </p>
                </div>

                {selectedAvatarFile || selectedAvatarError ? (
                  <div
                    className={cn(
                      "rounded-xl border p-3",
                      selectedAvatarError
                        ? "border-red-200 bg-red-50/80 dark:border-red-500/30 dark:bg-red-500/10"
                        : "border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-11 w-11">
                          <AvatarImage alt="Selected avatar preview" src={selectedAvatarPreviewUrl ?? undefined} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                            {selectedAvatarFile?.name ?? "Upload issue"}
                          </p>
                          <p
                            className={cn(
                              "mt-0.5 text-xs",
                              selectedAvatarError ? "text-red-700 dark:text-red-200" : "text-zinc-500 dark:text-zinc-400",
                            )}
                          >
                            {selectedAvatarError
                              ? selectedAvatarError
                              : `${avatarUploadPending ? "Uploading now" : "Ready to upload"} • ${formatFileSize(selectedAvatarFile?.size ?? 0)}`}
                          </p>
                        </div>
                      </div>
                      {!avatarUploadPending ? (
                        <Button
                          aria-label="Clear selected avatar"
                          className="h-8 w-8 shrink-0"
                          onClick={clearSelectedAvatar}
                          size="icon"
                          type="button"
                          variant="ghost"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <LoaderCircle className="mt-1 h-4 w-4 shrink-0 animate-spin text-sky-600 dark:text-sky-300" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "mt-3 h-1.5 overflow-hidden rounded-full",
                        selectedAvatarError ? "bg-red-100 dark:bg-red-950/40" : "bg-zinc-200 dark:bg-zinc-800",
                      )}
                    >
                      <div
                        className={cn(
                          "h-full rounded-full",
                          avatarUploadPending
                            ? "comment-upload-progress bg-sky-500"
                            : selectedAvatarError
                              ? "w-full bg-red-500"
                              : "w-full bg-emerald-500",
                        )}
                      />
                    </div>
                  </div>
                ) : null}

                <Button
                  className="w-full"
                  disabled={avatarUploadPending || !selectedAvatarFile || Boolean(selectedAvatarError)}
                  type="submit"
                  variant="outline"
                >
                  <Upload className="h-4 w-4" />
                  {avatarUploadPending ? "Uploading..." : selectedAvatarFile ? "Upload image" : "Choose an image first"}
                </Button>
              </form>

              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  setAvatarOperation("url");
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
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Use this when your avatar is hosted elsewhere and should stay synced from that URL.
                  </p>
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
                    setAvatarOperation("google");
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
                    setAvatarOperation("remove");
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
                    ? "Google sign-in is linked and ready to use for this account."
                    : "Link any Google account you want to use for OAuth sign-in with this account."
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

function AvatarFlowStatusCard({
  description,
  title,
  tone,
}: {
  description: string;
  title: string;
  tone: "info" | "success" | "error" | "pending";
}) {
  const Icon =
    tone === "success"
      ? CheckCircle2
      : tone === "error"
        ? CircleAlert
        : tone === "pending"
          ? LoaderCircle
          : Info;

  return (
    <div
      aria-live="polite"
      className={cn(
        "rounded-2xl border p-4",
        tone === "success" && "border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/30 dark:bg-emerald-500/10",
        tone === "error" && "border-red-200 bg-red-50/80 dark:border-red-500/30 dark:bg-red-500/10",
        tone === "pending" && "border-sky-200 bg-sky-50/80 dark:border-sky-500/30 dark:bg-sky-500/10",
        tone === "info" && "border-zinc-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/40",
      )}
      role="status"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 rounded-full p-2",
            tone === "success" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
            tone === "error" && "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200",
            tone === "pending" && "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
            tone === "info" && "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
          )}
        >
          <Icon className={cn("h-4 w-4", tone === "pending" && "animate-spin")} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{title}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{description}</p>
        </div>
      </div>
    </div>
  );
}

function getAvatarSource(image: string | null, googleImage: string | null): {
  badge: string;
  description: string;
  key: AvatarSource;
  label: string;
} {
  if (!image) {
    return {
      badge: "Initials active",
      description: "No custom avatar is saved right now, so your initials are shown across the workspace.",
      key: "none",
      label: "Initials fallback",
    };
  }

  if (image.startsWith("/uploads/")) {
    return {
      badge: "Uploaded avatar",
      description: "This image is stored in the app and will stay fixed until you replace or remove it.",
      key: "uploaded",
      label: "Uploaded file",
    };
  }

  if (googleImage && image === googleImage) {
    return {
      badge: "Google photo",
      description: "Your current avatar is using the Google profile photo linked to this account.",
      key: "google",
      label: "Google profile photo",
    };
  }

  return {
    badge: "External URL",
    description: "Your avatar is loaded from an external image URL.",
    key: "external",
    label: "External image URL",
  };
}

function getAvatarStatus({
  avatarOperation,
  avatarUploadPending,
  avatarUploadState,
  avatarUrlPending,
  avatarUrlState,
  currentAvatarSource,
  googleAvatarPending,
  googleAvatarState,
  removeAvatarPending,
  removeAvatarState,
  selectedAvatarError,
  selectedAvatarFile,
}: {
  avatarOperation: AvatarOperation;
  avatarUploadPending: boolean;
  avatarUploadState: ActionState;
  avatarUrlPending: boolean;
  avatarUrlState: ActionState;
  currentAvatarSource: ReturnType<typeof getAvatarSource>;
  googleAvatarPending: boolean;
  googleAvatarState: ActionState;
  removeAvatarPending: boolean;
  removeAvatarState: ActionState;
  selectedAvatarError: string | null;
  selectedAvatarFile: File | null;
}) {
  if (avatarOperation === "upload") {
    if (avatarUploadPending && selectedAvatarFile) {
      return {
        tone: "pending" as const,
        title: "Uploading avatar",
        description: `${selectedAvatarFile.name} is being saved now and will replace your ${currentAvatarSource.label.toLowerCase()}.`,
      };
    }

    if (avatarUploadState.status === "error" && avatarUploadState.message) {
      return {
        tone: "error" as const,
        title: "Upload failed",
        description: avatarUploadState.message,
      };
    }

    if (avatarUploadState.status === "success" && avatarUploadState.message) {
      return {
        tone: "success" as const,
        title: "Avatar updated",
        description: avatarUploadState.message,
      };
    }

    if (selectedAvatarError) {
      return {
        tone: "error" as const,
        title: "Fix the selected file",
        description: selectedAvatarError,
      };
    }

    if (selectedAvatarFile) {
      return {
        tone: "info" as const,
        title: "Ready to upload",
        description: `${selectedAvatarFile.name} looks valid. Submit to replace your current avatar.`,
      };
    }
  }

  if (avatarOperation === "url") {
    if (avatarUrlPending) {
      return {
        tone: "pending" as const,
        title: "Saving avatar URL",
        description: "The external image URL is being saved and applied to your profile.",
      };
    }

    if (avatarUrlState.status === "error" && avatarUrlState.message) {
      return {
        tone: "error" as const,
        title: "Avatar URL not saved",
        description: avatarUrlState.message,
      };
    }

    if (avatarUrlState.status === "success" && avatarUrlState.message) {
      return {
        tone: "success" as const,
        title: "Avatar URL updated",
        description: avatarUrlState.message,
      };
    }
  }

  if (avatarOperation === "google") {
    if (googleAvatarPending) {
      return {
        tone: "pending" as const,
        title: "Applying Google photo",
        description: "Your linked Google profile image is being applied as the avatar.",
      };
    }

    if (googleAvatarState.status === "error" && googleAvatarState.message) {
      return {
        tone: "error" as const,
        title: "Google photo not applied",
        description: googleAvatarState.message,
      };
    }

    if (googleAvatarState.status === "success" && googleAvatarState.message) {
      return {
        tone: "success" as const,
        title: "Google photo applied",
        description: googleAvatarState.message,
      };
    }
  }

  if (avatarOperation === "remove") {
    if (removeAvatarPending) {
      return {
        tone: "pending" as const,
        title: "Removing avatar",
        description: "Your current avatar is being cleared. Initials will be shown until you set a new image.",
      };
    }

    if (removeAvatarState.status === "error" && removeAvatarState.message) {
      return {
        tone: "error" as const,
        title: "Avatar not removed",
        description: removeAvatarState.message,
      };
    }

    if (removeAvatarState.status === "success" && removeAvatarState.message) {
      return {
        tone: "success" as const,
        title: "Avatar removed",
        description: removeAvatarState.message,
      };
    }
  }

  return {
    tone: "info" as const,
    title: "Avatar status",
    description:
      currentAvatarSource.key === "none"
        ? "You are currently using initials only. Upload an image, save a URL, or apply your Google photo."
        : `You are currently using ${currentAvatarSource.label.toLowerCase()}. Replace it with an upload, a URL, or your Google photo.`,
  };
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${size} B`;
}
