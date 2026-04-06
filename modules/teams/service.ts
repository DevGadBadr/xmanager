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
  creatorMembershipId: string;
  actorUserId: string;
  name: string;
  description?: string;
  managerMembershipId?: string | null;
}) {
  const team = await db.team.create({
    data: {
      workspaceId: input.workspaceId,
      creatorMembershipId: input.creatorMembershipId,
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

export async function getTeamEditContext(teamId: string, workspaceId: string) {
  return db.team.findFirstOrThrow({
    where: {
      id: teamId,
      workspaceId,
      isArchived: false,
    },
    select: {
      id: true,
      creatorMembershipId: true,
      name: true,
    },
  });
}

export async function updateTeamContent(input: {
  workspaceId: string;
  teamId: string;
  actorUserId: string;
  name: string;
  description?: string;
}) {
  await db.team.findFirstOrThrow({
    where: {
      id: input.teamId,
      workspaceId: input.workspaceId,
      isArchived: false,
    },
    select: {
      id: true,
    },
  });

  const team = await db.team.update({
    where: {
      id: input.teamId,
    },
    data: {
      name: input.name,
      description: input.description || null,
    },
  });

  await db.activityLog.create({
    data: {
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      entityType: "TEAM",
      entityId: team.id,
      action: "UPDATED",
      message: `Updated team ${team.name}`,
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

  return team;
}
