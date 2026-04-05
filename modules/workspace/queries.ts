import { db } from "@/lib/db";

import { listRecentActivity } from "@/modules/activity/service";

export async function getDashboardData(workspaceId: string, membershipId: string) {
  const [projectCount, teamCount, openTaskCount, assignedTasks, recentActivity] =
    await Promise.all([
      db.project.count({
        where: {
          workspaceId,
          isArchived: false,
        },
      }),
      db.team.count({
        where: {
          workspaceId,
          isArchived: false,
        },
      }),
      db.task.count({
        where: {
          workspaceId,
          isArchived: false,
          status: {
            in: ["TODO", "IN_PROGRESS", "IN_REVIEW"],
          },
        },
      }),
      db.task.findMany({
        where: {
          workspaceId,
          assignees: {
            some: {
              membershipId,
            },
          },
          isArchived: false,
        },
        include: {
          project: true,
        },
        orderBy: [
          {
            dueDate: "asc",
          },
          {
            createdAt: "desc",
          },
        ],
        take: 6,
      }),
      listRecentActivity(workspaceId, 10),
    ]);

  return {
    projectCount,
    teamCount,
    openTaskCount,
    assignedTasks,
    recentActivity,
  };
}

export async function getWorkspaceSettings(workspaceId: string) {
  return db.workspace.findUniqueOrThrow({
    where: {
      id: workspaceId,
    },
    include: {
      owner: true,
      memberships: {
        where: {
          isArchived: false,
        },
      },
    },
  });
}
