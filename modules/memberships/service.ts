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
