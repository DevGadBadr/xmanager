import { addHours } from "date-fns";

import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import {
  sendTeamAssignmentEmail,
  sendWelcomeEmail,
  sendWorkspaceInviteEmail,
} from "@/lib/mail";
import { hashPassword } from "@/lib/password";
import { hashToken, generateInviteToken } from "@/lib/tokens";
import { formatDate } from "@/lib/utils";
import { createNotification } from "@/modules/notifications/service";

export async function listWorkspaceInvitations(workspaceId: string) {
  return db.invitation.findMany({
    where: {
      workspaceId,
      status: "PENDING",
    },
    include: {
      team: true,
      invitedBy: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getInvitationByToken(token: string) {
  const invitation = await db.invitation.findUnique({
    where: {
      tokenHash: hashToken(token),
    },
    include: {
      workspace: true,
      team: true,
    },
  });

  if (!invitation) {
    return null;
  }

  if (invitation.status === "PENDING" && invitation.expiresAt <= new Date()) {
    await db.invitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        status: "EXPIRED",
      },
    });

    return {
      ...invitation,
      status: "EXPIRED" as const,
    };
  }

  return invitation;
}

export async function revokeInvitation(input: {
  invitationId: string;
  workspaceId: string;
  actorUserId: string;
}) {
  const invitation = await db.invitation.findFirst({
    where: {
      id: input.invitationId,
      workspaceId: input.workspaceId,
    },
    include: {
      workspace: true,
      team: true,
    },
  });

  if (!invitation) {
    throw new Error("Invitation not found.");
  }

  if (invitation.status !== "PENDING") {
    throw new Error("Only pending invitations can be removed.");
  }

  const updatedInvitation = await db.invitation.update({
    where: {
      id: invitation.id,
    },
    data: {
      status: "REVOKED",
    },
  });

  await db.activityLog.create({
    data: {
      workspaceId: invitation.workspaceId,
      actorUserId: input.actorUserId,
      entityType: "INVITATION",
      entityId: invitation.id,
      action: "UPDATED",
      message: `Revoked invite for ${invitation.email}`,
      metadata: {
        email: invitation.email,
        role: invitation.role,
        teamId: invitation.teamId ?? null,
      },
    },
  });

  return updatedInvitation;
}

export async function createInvitation(input: {
  workspaceId: string;
  invitedByMembershipId: string;
  email: string;
  role: "OWNER" | "ADMIN" | "TEAM_MANAGER" | "MEMBER";
  teamId?: string | null;
}) {
  const env = getEnv();
  const normalizedEmail = input.email.trim().toLowerCase();
  const now = new Date();

  const [workspace, existingMember, pendingInvite] = await Promise.all([
    db.workspace.findUniqueOrThrow({
      where: {
        id: input.workspaceId,
      },
    }),
    db.membership.findFirst({
      where: {
        workspaceId: input.workspaceId,
        user: {
          email: normalizedEmail,
        },
        isArchived: false,
      },
    }),
    db.invitation.findFirst({
      where: {
        workspaceId: input.workspaceId,
        email: normalizedEmail,
        status: "PENDING",
        expiresAt: {
          gt: now,
        },
      },
    }),
  ]);

  if (existingMember) {
    throw new Error("That user is already a workspace member.");
  }

  if (pendingInvite) {
    throw new Error("There is already a pending invite for this email.");
  }

  const rawToken = generateInviteToken();
  const expiresAt = addHours(now, env.INVITE_TOKEN_TTL_HOURS);

  const invitation = await db.invitation.create({
    data: {
      workspaceId: input.workspaceId,
      invitedByMembershipId: input.invitedByMembershipId,
      email: normalizedEmail,
      role: input.role,
      teamId: input.teamId || null,
      tokenHash: hashToken(rawToken),
      expiresAt,
    },
    include: {
      team: true,
    },
  });

  const inviteUrl = `${env.APP_URL}/invite/${rawToken}`;

  await Promise.all([
    sendWorkspaceInviteEmail({
      to: normalizedEmail,
      workspaceName: workspace.name,
      role: input.role.replaceAll("_", " "),
      inviteUrl,
    }),
    db.activityLog.create({
      data: {
        workspaceId: input.workspaceId,
        actorUserId: (
          await db.membership.findUniqueOrThrow({
            where: {
              id: input.invitedByMembershipId,
            },
            include: {
              user: true,
            },
          })
        ).userId,
        entityType: "INVITATION",
        entityId: invitation.id,
        action: "INVITED",
        message: `Invited ${normalizedEmail} to ${workspace.name}`,
        metadata: {
          email: normalizedEmail,
          role: input.role,
          teamId: input.teamId ?? null,
          expiresAt: formatDate(expiresAt),
        },
      },
    }),
  ]);

  return invitation;
}

export async function acceptInvitation(input: {
  token: string;
  fullName: string;
  title: string;
  department: string;
  password: string;
}) {
  const env = getEnv();
  const invitation = await getInvitationByToken(input.token);

  if (!invitation || invitation.status !== "PENDING") {
    throw new Error("This invitation is no longer valid.");
  }

  const normalizedEmail = invitation.email.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);

  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: {
        email: normalizedEmail,
      },
      update: {
        name: input.fullName,
        fullName: input.fullName,
        title: input.title,
        department: input.department,
        passwordHash,
        emailVerified: new Date(),
        lastActiveAt: new Date(),
      },
      create: {
        email: normalizedEmail,
        name: input.fullName,
        fullName: input.fullName,
        title: input.title,
        department: input.department,
        passwordHash,
        emailVerified: new Date(),
        lastActiveAt: new Date(),
      },
    });

    const membership = await tx.membership.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
        },
      },
      update: {
        role: invitation.role,
        status: "ACTIVE",
        isArchived: false,
      },
      create: {
        workspaceId: invitation.workspaceId,
        userId: user.id,
        role: invitation.role,
        status: "ACTIVE",
      },
    });

    if (invitation.teamId) {
      await tx.teamMember.upsert({
        where: {
          teamId_membershipId: {
            teamId: invitation.teamId,
            membershipId: membership.id,
          },
        },
        update: {},
        create: {
          teamId: invitation.teamId,
          membershipId: membership.id,
        },
      });
    }

    await tx.invitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        acceptedByMembershipId: membership.id,
      },
    });

    await tx.activityLog.create({
      data: {
        workspaceId: invitation.workspaceId,
        actorUserId: user.id,
        entityType: "INVITATION",
        entityId: invitation.id,
        action: "ACCEPTED",
        message: `${input.fullName} joined ${invitation.workspace.name}`,
        metadata: {
          email: normalizedEmail,
          teamId: invitation.teamId ?? null,
        },
      },
    });

    return {
      user,
      membership,
    };
  });

  await createNotification({
    workspaceId: invitation.workspaceId,
    userId: result.user.id,
    type: "WELCOME",
    title: "Welcome to Flow",
    body: `Your access to ${invitation.workspace.name} is active.`,
    link: "/dashboard",
  });

  await sendWelcomeEmail({
    to: result.user.email,
    fullName: input.fullName,
    workspaceName: invitation.workspace.name,
    dashboardUrl: `${env.APP_URL}/dashboard`,
  });

  if (invitation.team) {
    await createNotification({
      workspaceId: invitation.workspaceId,
      userId: result.user.id,
      type: "TEAM_ASSIGNMENT",
      title: "New team assignment",
      body: `You were added to ${invitation.team.name}.`,
      link: "/teams",
    });

    await sendTeamAssignmentEmail({
      to: result.user.email,
      fullName: input.fullName,
      teamName: invitation.team.name,
      workspaceName: invitation.workspace.name,
      workspaceUrl: `${env.APP_URL}/teams`,
    });
  }

  return result;
}
