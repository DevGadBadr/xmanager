import type { Account, Profile } from "next-auth";

import { db } from "@/lib/db";

const DEFAULT_OWNER_EMAIL = (process.env.DEFAULT_OWNER_EMAIL ?? "owner@example.com")
  .trim()
  .toLowerCase();
const DEFAULT_WORKSPACE_NAME = process.env.DEFAULT_WORKSPACE_NAME ?? "XManager Workspace";
const DEFAULT_TEAM_NAME = "Core Delivery";
const DEFAULT_PROJECT_KEY = "LAUNCH";
const DEFAULT_PROJECT_NAME = "Workspace Launch";
const DEFAULT_TASK_TITLE = "Validate invite-first onboarding flow";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? null;
}

function getProfileName(profile?: Profile) {
  const name = profile?.name;
  return typeof name === "string" && name.trim().length > 0 ? name.trim() : null;
}

function getProfileImage(profile?: Profile) {
  const image = (profile as Record<string, unknown> | undefined)?.picture;
  return typeof image === "string" && image.trim().length > 0 ? image.trim() : null;
}

export function isPrimaryOwnerEmail(email?: string | null) {
  return normalizeEmail(email) === DEFAULT_OWNER_EMAIL;
}

export async function repairPrimaryOwnerAccountCollision(input: {
  account?: Account | null;
  profile?: Profile;
  email?: string | null;
}) {
  if (!isPrimaryOwnerEmail(input.email)) {
    return;
  }

  const account = input.account;

  if (!account?.providerAccountId || account.provider !== "google" || account.type !== "oauth") {
    return;
  }

  const existingUser = await db.user.findUnique({
    where: {
      email: DEFAULT_OWNER_EMAIL,
    },
    include: {
      accounts: true,
    },
  });

  if (!existingUser || existingUser.accounts.length > 0) {
    return;
  }

  const profileName = getProfileName(input.profile);
  const profileImage = getProfileImage(input.profile);
  const oauthAccount = account as Account & Record<string, unknown>;

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        name: profileName ?? existingUser.name,
        fullName: existingUser.fullName ?? profileName,
        image: profileImage ?? existingUser.image,
        googleImage: profileImage ?? existingUser.googleImage,
        emailVerified: existingUser.emailVerified ?? new Date(),
        lastActiveAt: new Date(),
      },
    });

    await tx.account.create({
      data: {
        userId: existingUser.id,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token:
          typeof oauthAccount.refresh_token === "string" ? oauthAccount.refresh_token : null,
        access_token:
          typeof oauthAccount.access_token === "string" ? oauthAccount.access_token : null,
        expires_at:
          typeof oauthAccount.expires_at === "number" ? oauthAccount.expires_at : null,
        token_type: typeof oauthAccount.token_type === "string" ? oauthAccount.token_type : null,
        scope: typeof oauthAccount.scope === "string" ? oauthAccount.scope : null,
        id_token: typeof oauthAccount.id_token === "string" ? oauthAccount.id_token : null,
        session_state:
          typeof oauthAccount.session_state === "string" ? oauthAccount.session_state : null,
      },
    });
  });
}

export async function bootstrapPrimaryOwner(user: {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}) {
  if (!isPrimaryOwnerEmail(user.email)) {
    return;
  }

  const workspaceSlug = slugify(DEFAULT_WORKSPACE_NAME);
  const displayName = user.name?.trim() || "Gad Badr";

  await db.$transaction(async (tx) => {
    const existingUser = await tx.user.findUniqueOrThrow({
      where: {
        id: user.id,
      },
    });

    await tx.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: existingUser.name ?? displayName,
        fullName: existingUser.fullName ?? displayName,
        image: existingUser.image ?? user.image ?? undefined,
        title: existingUser.title ?? "Owner",
        department: existingUser.department ?? "Operations",
        lastActiveAt: new Date(),
      },
    });

    const workspace = await tx.workspace.upsert({
      where: {
        slug: workspaceSlug,
      },
      update: {
        name: DEFAULT_WORKSPACE_NAME,
        ownerUserId: user.id,
        isArchived: false,
      },
      create: {
        name: DEFAULT_WORKSPACE_NAME,
        slug: workspaceSlug,
        ownerUserId: user.id,
      },
    });

    const membership = await tx.membership.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: user.id,
        },
      },
      update: {
        role: "OWNER",
        status: "ACTIVE",
        isArchived: false,
      },
      create: {
        workspaceId: workspace.id,
        userId: user.id,
        role: "OWNER",
        status: "ACTIVE",
      },
    });

    const team = await tx.team.upsert({
      where: {
        workspaceId_name: {
          workspaceId: workspace.id,
          name: DEFAULT_TEAM_NAME,
        },
      },
      update: {
        creatorMembershipId: membership.id,
        managerMembershipId: membership.id,
        isArchived: false,
      },
      create: {
        workspaceId: workspace.id,
        name: DEFAULT_TEAM_NAME,
        description: "Default seeded team for initial delivery work.",
        creatorMembershipId: membership.id,
        managerMembershipId: membership.id,
      },
    });

    await tx.teamMember.upsert({
      where: {
        teamId_membershipId: {
          teamId: team.id,
          membershipId: membership.id,
        },
      },
      update: {},
      create: {
        teamId: team.id,
        membershipId: membership.id,
      },
    });

    const project = await tx.project.upsert({
      where: {
        workspaceId_key: {
          workspaceId: workspace.id,
          key: DEFAULT_PROJECT_KEY,
        },
      },
      update: {
        ownerMembershipId: membership.id,
        name: DEFAULT_PROJECT_NAME,
        status: "ACTIVE",
        isArchived: false,
      },
      create: {
        workspaceId: workspace.id,
        ownerMembershipId: membership.id,
        name: DEFAULT_PROJECT_NAME,
        key: DEFAULT_PROJECT_KEY,
        description: "Seeded project to verify dashboard, projects, and tasks.",
        status: "ACTIVE",
      },
    });

    await tx.projectMember.upsert({
      where: {
        projectId_membershipId: {
          projectId: project.id,
          membershipId: membership.id,
        },
      },
      update: {},
      create: {
        projectId: project.id,
        membershipId: membership.id,
      },
    });

    const existingTask = await tx.task.findFirst({
      where: {
        workspaceId: workspace.id,
        projectId: project.id,
        title: DEFAULT_TASK_TITLE,
      },
    });

    if (!existingTask) {
      await tx.task.create({
        data: {
          workspaceId: workspace.id,
          projectId: project.id,
          creatorMembershipId: membership.id,
          reporterMembershipId: membership.id,
          assignees: {
            create: {
              membershipId: membership.id,
            },
          },
          title: DEFAULT_TASK_TITLE,
          description: "Verify seeded owner access, invitation creation, and dashboard rendering.",
          priority: "HIGH",
          status: "IN_PROGRESS",
        },
      });
    }
  });
}

export async function touchUserLastActive(userId: string) {
  await db.user.update({
    where: {
      id: userId,
    },
    data: {
      lastActiveAt: new Date(),
    },
  });
}

export async function syncGoogleIdentitySnapshot(input: {
  userId: string;
  profile?: Profile | null;
}) {
  const profileName = getProfileName(input.profile ?? undefined);
  const profileImage = getProfileImage(input.profile ?? undefined);
  const existingUser = await db.user.findUnique({
    where: {
      id: input.userId,
    },
    select: {
      fullName: true,
      googleImage: true,
      image: true,
      name: true,
    },
  });

  if (!existingUser) {
    return;
  }

  await db.user.update({
    where: {
      id: input.userId,
    },
    data: {
      name: existingUser.name ?? profileName ?? undefined,
      fullName: existingUser.fullName ?? profileName ?? undefined,
      googleImage: profileImage ?? existingUser.googleImage ?? undefined,
      image:
        profileImage && (!existingUser.image || existingUser.image === existingUser.googleImage)
          ? profileImage
          : undefined,
      emailVerified: new Date(),
      lastActiveAt: new Date(),
    },
  });
}
