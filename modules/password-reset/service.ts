import { addMinutes, differenceInSeconds } from "date-fns";

import { db } from "@/lib/db";
import { sendPasswordResetCodeEmail } from "@/lib/mail";
import { hashPassword } from "@/lib/password";
import { generateOneTimeCode, hashToken } from "@/lib/tokens";

const PASSWORD_RESET_CODE_TTL_MINUTES = 15;
const PASSWORD_RESET_RESEND_COOLDOWN_SECONDS = 60;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const user = await db.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      email: true,
      fullName: true,
      id: true,
      memberships: {
        where: {
          isArchived: false,
          status: "ACTIVE",
          workspace: {
            isArchived: false,
          },
        },
        take: 1,
      },
      name: true,
    },
  });

  if (!user || user.memberships.length === 0) {
    return;
  }

  const now = new Date();
  const activeCode = await db.passwordResetCode.findFirst({
    where: {
      userId: user.id,
      consumedAt: null,
      expiresAt: {
        gt: now,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (
    activeCode &&
    differenceInSeconds(now, activeCode.createdAt) < PASSWORD_RESET_RESEND_COOLDOWN_SECONDS
  ) {
    return;
  }

  const code = generateOneTimeCode();
  const expiresAt = addMinutes(now, PASSWORD_RESET_CODE_TTL_MINUTES);

  await db.$transaction(async (tx) => {
    await tx.passwordResetCode.updateMany({
      where: {
        userId: user.id,
        consumedAt: null,
      },
      data: {
        consumedAt: now,
      },
    });

    await tx.passwordResetCode.create({
      data: {
        userId: user.id,
        codeHash: hashToken(code),
        expiresAt,
      },
    });
  });

  await sendPasswordResetCodeEmail({
    to: user.email,
    fullName: user.fullName ?? user.name ?? user.email,
    code,
    expiryMinutes: PASSWORD_RESET_CODE_TTL_MINUTES,
  });
}

export async function resetPasswordWithCode(input: {
  code: string;
  email: string;
  password: string;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  const user = await db.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
      memberships: {
        where: {
          isArchived: false,
          status: "ACTIVE",
          workspace: {
            isArchived: false,
          },
        },
        take: 1,
      },
    },
  });

  if (!user || user.memberships.length === 0) {
    throw new Error("The reset code is invalid or expired.");
  }

  const now = new Date();
  const activeCode = await db.passwordResetCode.findFirst({
    where: {
      userId: user.id,
      consumedAt: null,
      expiresAt: {
        gt: now,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!activeCode) {
    throw new Error("The reset code is invalid or expired.");
  }

  if (activeCode.attempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
    await db.passwordResetCode.update({
      where: {
        id: activeCode.id,
      },
      data: {
        consumedAt: now,
      },
    });

    throw new Error("The reset code is invalid or expired.");
  }

  if (hashToken(input.code.trim()) !== activeCode.codeHash) {
    const nextAttempts = activeCode.attempts + 1;

    await db.passwordResetCode.update({
      where: {
        id: activeCode.id,
      },
      data: {
        attempts: nextAttempts,
        consumedAt: nextAttempts >= PASSWORD_RESET_MAX_ATTEMPTS ? now : undefined,
      },
    });

    throw new Error("The reset code is invalid or expired.");
  }

  const passwordHash = await hashPassword(input.password);

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerified: new Date(),
        passwordHash,
      },
    });

    await tx.passwordResetCode.updateMany({
      where: {
        userId: user.id,
        consumedAt: null,
      },
      data: {
        consumedAt: now,
      },
    });
  });
}
