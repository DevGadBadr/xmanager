import { db } from "@/lib/db";

export async function listWorkspaceMembers(workspaceId: string) {
  return db.membership.findMany({
    where: {
      workspaceId,
      isArchived: false,
    },
    include: {
      user: true,
      teamLinks: {
        include: {
          team: true,
        },
      },
    },
    orderBy: [
      {
        role: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });
}

export async function listWorkspaceMembershipOptions(workspaceId: string) {
  return db.membership.findMany({
    where: {
      workspaceId,
      isArchived: false,
      status: "ACTIVE",
    },
    include: {
      user: true,
    },
    orderBy: {
      user: {
        email: "asc",
      },
    },
  });
}

export async function removeWorkspaceMember(input: {
  membershipId: string;
  workspaceId: string;
  actorUserId: string;
}) {
  const membership = await db.membership.findFirst({
    where: {
      id: input.membershipId,
      workspaceId: input.workspaceId,
      isArchived: false,
    },
    include: {
      user: true,
      workspace: true,
    },
  });

  if (!membership) {
    throw new Error("User not found.");
  }

  if (membership.userId === input.actorUserId) {
    throw new Error("You cannot delete your own workspace account.");
  }

  if (membership.userId === membership.workspace.ownerUserId) {
    throw new Error("The workspace owner cannot be deleted.");
  }

  await db.$transaction(async (tx) => {
    await tx.team.updateMany({
      where: {
        managerMembershipId: membership.id,
      },
      data: {
        managerMembershipId: null,
      },
    });

    await tx.teamMember.deleteMany({
      where: {
        membershipId: membership.id,
      },
    });

    await tx.projectMember.deleteMany({
      where: {
        membershipId: membership.id,
      },
    });

    await tx.task.updateMany({
      where: {
        assigneeMembershipId: membership.id,
      },
      data: {
        assigneeMembershipId: null,
      },
    });

    await tx.task.updateMany({
      where: {
        reporterMembershipId: membership.id,
      },
      data: {
        reporterMembershipId: null,
      },
    });

    await tx.membership.update({
      where: {
        id: membership.id,
      },
      data: {
        status: "DISABLED",
        isArchived: true,
      },
    });

    await tx.activityLog.create({
      data: {
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        entityType: "MEMBERSHIP",
        entityId: membership.id,
        action: "ARCHIVED",
        message: `Removed ${membership.user.fullName ?? membership.user.email} from ${membership.workspace.name}`,
        metadata: {
          email: membership.user.email,
          role: membership.role,
        },
      },
    });
  });
}
