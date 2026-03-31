import type { ProjectStatus } from "@prisma/client";

import { db } from "@/lib/db";

export async function listProjects(workspaceId: string) {
  return db.project.findMany({
    where: {
      workspaceId,
      isArchived: false,
    },
    include: {
      folder: true,
      owner: {
        include: {
          user: true,
        },
      },
      tasks: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function listProjectExplorer(workspaceId: string) {
  const [folders, projects] = await Promise.all([
    db.folder.findMany({
      where: {
        workspaceId,
        scope: "PROJECT",
        isArchived: false,
      },
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),
    db.project.findMany({
      where: {
        workspaceId,
        isArchived: false,
      },
      select: {
        id: true,
        name: true,
        key: true,
        status: true,
        folderId: true,
        tasks: {
          where: {
            isArchived: false,
          },
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: [
        {
          name: "asc",
        },
      ],
    }),
  ]);

  return {
    folders,
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      key: project.key,
      status: project.status,
      folderId: project.folderId,
      taskCount: project.tasks.length,
      openTaskCount: project.tasks.filter((task) => task.status !== "DONE" && task.status !== "CANCELLED").length,
    })),
  };
}

export async function getProjectWorkspace(
  projectId: string,
  workspaceId: string,
  filters?: {
    assigneeMembershipId?: string;
    search?: string;
  },
) {
  const search = filters?.search?.trim();

  return db.project.findFirstOrThrow({
    where: {
      id: projectId,
      workspaceId,
      isArchived: false,
    },
    include: {
      folder: true,
      owner: {
        include: {
          user: true,
        },
      },
      members: {
        include: {
          membership: {
            include: {
              user: true,
            },
          },
        },
      },
      tasks: {
        where: {
          isArchived: false,
          ...(filters?.assigneeMembershipId
            ? {
                assigneeMembershipId: filters.assigneeMembershipId,
              }
            : {}),
          ...(search
            ? {
                OR: [
                  {
                    title: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    description: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {}),
        },
        include: {
          assignee: {
            include: {
              user: true,
            },
          },
        },
        orderBy: [
          {
            position: "asc",
          },
          {
            startDate: "asc",
          },
          {
            dueDate: "asc",
          },
          {
            createdAt: "desc",
          },
        ],
      },
    },
  });
}

export async function getProjectDetails(projectId: string, workspaceId: string) {
  return db.project.findFirstOrThrow({
    where: {
      id: projectId,
      workspaceId,
    },
    include: {
      folder: true,
      owner: {
        include: {
          user: true,
        },
      },
      members: {
        include: {
          membership: {
            include: {
              user: true,
            },
          },
        },
      },
      tasks: {
        where: {
          isArchived: false,
        },
        include: {
          assignee: {
            include: {
              user: true,
            },
          },
        },
        orderBy: [
          {
            dueDate: "asc",
          },
          {
            createdAt: "desc",
          },
        ],
      },
    },
  });
}

export async function createProject(input: {
  workspaceId: string;
  ownerMembershipId: string;
  actorUserId: string;
  name: string;
  key: string;
  description?: string;
  status: ProjectStatus;
  folderId?: string | null;
  dueDate?: string;
}) {
  if (input.folderId) {
    const folder = await db.folder.findFirst({
      where: {
        id: input.folderId,
        workspaceId: input.workspaceId,
        scope: "PROJECT",
        isArchived: false,
      },
      select: {
        id: true,
      },
    });

    if (!folder) {
      throw new Error("Selected folder is not available.");
    }
  }

  const project = await db.project.create({
    data: {
      workspaceId: input.workspaceId,
      ownerMembershipId: input.ownerMembershipId,
      folderId: input.folderId || null,
      name: input.name,
      key: input.key,
      description: input.description || null,
      status: input.status,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      members: {
        create: {
          membershipId: input.ownerMembershipId,
        },
      },
    },
  });

  await db.activityLog.create({
    data: {
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      entityType: "PROJECT",
      entityId: project.id,
      action: "CREATED",
      message: `Created project ${project.name}`,
      metadata: {
        key: project.key,
      },
    },
  });

  return project;
}
