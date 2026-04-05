import { db } from "@/lib/db";

export async function listTeams(workspaceId: string) {
  return db.team.findMany({
    where: {
      workspaceId,
      isArchived: false,
    },
    include: {
      manager: {
        include: {
          user: true,
        },
      },
      members: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function createTeam(input: {
  workspaceId: string;
  actorUserId: string;
  name: string;
  description?: string;
  managerMembershipId?: string | null;
}) {
  const team = await db.team.create({
    data: {
      workspaceId: input.workspaceId,
      name: input.name,
      description: input.description || null,
      managerMembershipId: input.managerMembershipId || null,
    },
  });

  await db.activityLog.create({
    data: {
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      entityType: "TEAM",
      entityId: team.id,
      action: "CREATED",
      message: `Created team ${team.name}`,
    },
  });

  return team;
}

export async function deleteTeam(input: {
  teamId: string;
  workspaceId: string;
  actorUserId: string;
}) {
  const team = await db.team.findFirst({
    where: {
      id: input.teamId,
      workspaceId: input.workspaceId,
      isArchived: false,
    },
  });

  if (!team) {
    throw new Error("Team not found.");
  }

  await db.team.delete({
    where: {
      id: team.id,
    },
  });

  await db.activityLog.create({
    data: {
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      entityType: "TEAM",
      entityId: team.id,
      action: "ARCHIVED",
      message: `Deleted team ${team.name}`,
    },
  });
}
