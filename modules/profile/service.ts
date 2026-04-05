import { db } from "@/lib/db";
import { removeStoredUserAvatarIfOwned, persistUserAvatar } from "@/lib/avatar-storage";

export async function getProfilePageData(userId: string, workspaceId: string) {
  const [user, membership] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: {
        createdAt: true,
        department: true,
        email: true,
        fullName: true,
        googleImage: true,
        id: true,
        image: true,
        lastActiveAt: true,
        name: true,
        passwordHash: true,
        title: true,
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    }),
    db.membership.findFirstOrThrow({
      where: {
        workspaceId,
        userId,
        isArchived: false,
        status: "ACTIVE",
      },
      include: {
        teamLinks: {
          include: {
            team: true,
          },
        },
        workspace: true,
      },
    }),
  ]);

  return {
    hasGoogleAccount: user.accounts.some((account) => account.provider === "google"),
    hasPassword: Boolean(user.passwordHash),
    membership: {
      joinedAt: membership.joinedAt,
      role: membership.role,
      teamNames: membership.teamLinks.map((link) => link.team.name),
      workspaceName: membership.workspace.name,
    },
    user: {
      createdAt: user.createdAt,
      department: user.department,
      email: user.email,
      fullName: user.fullName ?? user.name ?? "",
      googleImage: user.googleImage,
      id: user.id,
      image: user.image,
      lastActiveAt: user.lastActiveAt,
      title: user.title ?? "",
    },
  };
}

export async function updateProfileDetails(input: {
  userId: string;
  fullName: string;
  title: string;
  department: string;
}) {
  return db.user.update({
    where: {
      id: input.userId,
    },
    data: {
      department: input.department,
      fullName: input.fullName,
      name: input.fullName,
      title: input.title,
    },
  });
}

export async function updateProfileAvatarUrl(input: {
  userId: string;
  avatarUrl: string | null;
}) {
  const existingUser = await db.user.findUniqueOrThrow({
    where: {
      id: input.userId,
    },
    select: {
      image: true,
    },
  });

  if (existingUser.image && existingUser.image !== input.avatarUrl) {
    await removeStoredUserAvatarIfOwned(existingUser.image);
  }

  return db.user.update({
    where: {
      id: input.userId,
    },
    data: {
      image: input.avatarUrl,
    },
  });
}

export async function uploadProfileAvatar(input: {
  userId: string;
  file: File;
}) {
  const existingUser = await db.user.findUniqueOrThrow({
    where: {
      id: input.userId,
    },
    select: {
      image: true,
    },
  });
  const storedAvatarPath = await persistUserAvatar(input.userId, input.file);

  if (existingUser.image && existingUser.image !== storedAvatarPath) {
    await removeStoredUserAvatarIfOwned(existingUser.image);
  }

  return db.user.update({
    where: {
      id: input.userId,
    },
    data: {
      image: storedAvatarPath,
    },
  });
}

export async function removeProfileAvatar(userId: string) {
  const existingUser = await db.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
    select: {
      image: true,
    },
  });

  await removeStoredUserAvatarIfOwned(existingUser.image);

  return db.user.update({
    where: {
      id: userId,
    },
    data: {
      image: null,
    },
  });
}

export async function applyGoogleProfileAvatar(userId: string) {
  const existingUser = await db.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
    select: {
      googleImage: true,
      image: true,
    },
  });

  if (!existingUser.googleImage) {
    throw new Error("Link Google first to import your Google profile photo.");
  }

  if (existingUser.image && existingUser.image !== existingUser.googleImage) {
    await removeStoredUserAvatarIfOwned(existingUser.image);
  }

  return db.user.update({
    where: {
      id: userId,
    },
    data: {
      image: existingUser.googleImage,
    },
  });
}

export async function unlinkGoogleAccount(userId: string) {
  const user = await db.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
    select: {
      googleImage: true,
      image: true,
      passwordHash: true,
    },
  });

  if (!user.passwordHash) {
    throw new Error("Set an email password before removing Google sign-in.");
  }

  await db.$transaction(async (tx) => {
    await tx.account.deleteMany({
      where: {
        provider: "google",
        userId,
      },
    });

    await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        googleImage: null,
        image: user.image === user.googleImage ? null : undefined,
      },
    });
  });
}
