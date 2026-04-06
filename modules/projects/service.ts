import { randomBytes } from "node:crypto";
import { Prisma, type ProjectStatus } from "@prisma/client";

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
  const projects = await db.project.findMany({
    where: {
      workspaceId,
      isArchived: false,
    },
    select: {
      id: true,
      name: true,
      key: true,
      description: true,
      status: true,
      ownerMembershipId: true,
      tasks: {
        where: {
          isArchived: false,
        },
        select: {
          id: true,
          title: true,
          status: true,
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
    orderBy: [
      {
        name: "asc",
      },
    ],
  });

  return {
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      key: project.key,
      description: project.description,
      status: project.status,
      ownerMembershipId: project.ownerMembershipId,
      taskCount: project.tasks.length,
      openTaskCount: project.tasks.filter((task) => task.status !== "DONE" && task.status !== "CANCELLED").length,
      tasks: project.tasks.map((task) => ({
        id: task.id,
        name: task.title,
        status: task.status,
      })),
    })),
  };
}

export async function getProjectWorkspace(
  projectId: string,
  workspaceId: string,
) {
  return db.project.findFirst({
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
        },
        include: {
          assignees: {
            include: {
              membership: {
                include: {
                  user: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
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
          assignees: {
            include: {
              membership: {
                include: {
                  user: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
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
  description?: string;
  status: ProjectStatus;
  dueDate?: string;
}) {
  let project: Awaited<ReturnType<typeof db.project.create>> | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      project = await db.project.create({
        data: {
          workspaceId: input.workspaceId,
          ownerMembershipId: input.ownerMembershipId,
          name: input.name,
          key: generateInternalProjectKey(),
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
      break;
    } catch (error) {
      if (!isProjectKeyConflict(error) || attempt === 4) {
        throw error;
      }
    }
  }

  if (!project) {
    throw new Error("Unable to create project.");
  }

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

function generateInternalProjectKey() {
  return `PRJ${randomBytes(4).toString("hex").toUpperCase()}`;
}

function isProjectKeyConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes("workspaceId") &&
    error.meta.target.includes("key")
  );
}

export async function getProjectEditContext(projectId: string, workspaceId: string) {
  return db.project.findFirstOrThrow({
    where: {
      id: projectId,
      workspaceId,
      isArchived: false,
    },
    select: {
      id: true,
      ownerMembershipId: true,
      name: true,
    },
  });
}

export async function updateProjectContent(input: {
  workspaceId: string;
  projectId: string;
  actorUserId: string;
  name: string;
  description?: string;
}) {
  const existing = await getProjectEditContext(input.projectId, input.workspaceId);

  const project = await db.project.update({
    where: {
      id: input.projectId,
    },
    data: {
      name: input.name,
      description: input.description || null,
    },
    select: {
      id: true,
      name: true,
    },
  });

  await db.activityLog.create({
    data: {
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      entityType: "PROJECT",
      entityId: project.id,
      action: "UPDATED",
      message:
        existing.name !== project.name ? `Renamed project ${project.name}` : `Updated project details for ${project.name}`,
    },
  });

  return project;
}

export async function deleteProject(input: {
  workspaceId: string;
  projectId: string;
  actorUserId: string;
}) {
  const existing = await db.project.findFirstOrThrow({
    where: {
      id: input.projectId,
      workspaceId: input.workspaceId,
      isArchived: false,
    },
    select: {
      id: true,
      name: true,
    },
  });

  const project = await db.project.update({
    where: {
      id: existing.id,
    },
    data: {
      isArchived: true,
      tasks: {
        updateMany: {
          where: {
            isArchived: false,
          },
          data: {
            isArchived: true,
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  await db.activityLog.create({
    data: {
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      entityType: "PROJECT",
      entityId: project.id,
      action: "ARCHIVED",
      message: `Archived project ${project.name}`,
    },
  });

  return project;
}
