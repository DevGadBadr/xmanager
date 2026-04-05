import type { TaskPriority, TaskStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { sendTaskAssignmentEmail } from "@/lib/mail";
import { formatDate } from "@/lib/utils";
import { persistCommentAttachments } from "@/lib/comment-attachments";
import { createNotification } from "@/modules/notifications/service";

const taskAssigneeInclude = {
  include: {
    membership: {
      include: {
        user: true,
      },
    },
  },
  orderBy: {
    createdAt: "asc" as const,
  },
};

async function validateWorkspaceAssigneeIds(workspaceId: string, assigneeMembershipIds: string[]) {
  if (assigneeMembershipIds.length === 0) {
    return [];
  }

  const matchingMemberships = await db.membership.findMany({
    where: {
      workspaceId,
      id: {
        in: assigneeMembershipIds,
      },
    },
    select: {
      id: true,
    },
  });
  const validMembershipIds = new Set(matchingMemberships.map((membership) => membership.id));

  if (validMembershipIds.size !== assigneeMembershipIds.length) {
    throw new Error("One or more selected assignees are invalid for this workspace.");
  }

  return assigneeMembershipIds;
}

export async function getTaskDetails(taskId: string, workspaceId: string) {
  return db.task.findFirst({
    where: {
      id: taskId,
      workspaceId,
      isArchived: false,
    },
    include: {
      project: true,
      creator: {
        include: {
          user: true,
        },
      },
      reporter: {
        include: {
          user: true,
        },
      },
      assignees: taskAssigneeInclude,
      comments: {
        include: {
          attachments: {
            orderBy: {
              createdAt: "asc",
            },
          },
          author: {
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
  });
}

export async function createTask(input: {
  workspaceId: string;
  projectId: string;
  creatorMembershipId: string;
  actorUserId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  assigneeMembershipIds?: string[];
  startDate?: string;
  dueDate?: string;
}) {
  const assigneeMembershipIds = await validateWorkspaceAssigneeIds(
    input.workspaceId,
    Array.from(new Set((input.assigneeMembershipIds ?? []).map((membershipId) => membershipId.trim()).filter(Boolean))),
  );
  const task = await db.task.create({
    data: {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      creatorMembershipId: input.creatorMembershipId,
      reporterMembershipId: input.creatorMembershipId,
      title: input.title,
      description: input.description || null,
      priority: input.priority,
      assignees: assigneeMembershipIds.length
        ? {
            create: assigneeMembershipIds.map((membershipId) => ({
              membershipId,
            })),
          }
        : undefined,
      startDate: input.startDate ? new Date(input.startDate) : null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
    include: {
      project: true,
      assignees: taskAssigneeInclude,
    },
  });

  await db.activityLog.create({
    data: {
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      entityType: "TASK",
      entityId: task.id,
      action: "CREATED",
      message: `Created task ${task.title}`,
      metadata: {
        projectId: task.projectId,
      },
    },
  });

  if (task.assignees.length > 0) {
    const env = getEnv();

    await Promise.all([
      ...task.assignees.map((assignment) =>
        createNotification({
          workspaceId: input.workspaceId,
          userId: assignment.membership.user.id,
          type: "TASK_ASSIGNMENT",
          title: "New task assigned",
          body: task.title,
          link: `/tasks/${task.id}`,
        }),
      ),
      ...task.assignees.map((assignment) =>
        sendTaskAssignmentEmail({
          to: assignment.membership.user.email,
          fullName:
            assignment.membership.user.fullName ??
            assignment.membership.user.name ??
            assignment.membership.user.email,
          taskTitle: task.title,
          projectName: task.project.name,
          dueDate: formatDate(task.dueDate),
          taskUrl: `${env.APP_URL}/tasks/${task.id}`,
        }),
      ),
    ]);
  }

  return task;
}

export async function getTaskEditContext(taskId: string, workspaceId: string) {
  return db.task.findFirstOrThrow({
    where: {
      id: taskId,
      workspaceId,
      isArchived: false,
    },
    select: {
      id: true,
      projectId: true,
      creatorMembershipId: true,
      title: true,
    },
  });
}

export async function updateTask(input: {
  workspaceId: string;
  taskId: string;
  actorUserId: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeMembershipIds?: string[];
  startDate?: string;
  dueDate?: string;
}) {
  const existing = await db.task.findFirstOrThrow({
    where: {
      id: input.taskId,
      workspaceId: input.workspaceId,
      isArchived: false,
    },
    include: {
      project: true,
      assignees: taskAssigneeInclude,
    },
  });

  const assigneeMembershipIds = await validateWorkspaceAssigneeIds(
    input.workspaceId,
    Array.from(new Set((input.assigneeMembershipIds ?? []).map((membershipId) => membershipId.trim()).filter(Boolean))),
  );
  const existingAssigneeIds = existing.assignees.map((assignment) => assignment.membershipId);
  const hasAssignmentChanges =
    assigneeMembershipIds.length !== existingAssigneeIds.length ||
    assigneeMembershipIds.some((membershipId) => !existingAssigneeIds.includes(membershipId));
  const addedAssigneeIds = assigneeMembershipIds.filter((membershipId) => !existingAssigneeIds.includes(membershipId));
  const nextCompletedAt = input.status === "DONE" ? new Date() : null;
  const task = await db.task.update({
    where: {
      id: input.taskId,
    },
    data: {
      status: input.status,
      priority: input.priority,
      assignees: {
        deleteMany: {},
        create: assigneeMembershipIds.map((membershipId) => ({
          membershipId,
        })),
      },
      startDate: input.startDate ? new Date(input.startDate) : null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      completedAt: nextCompletedAt,
    },
    include: {
      project: true,
      assignees: taskAssigneeInclude,
    },
  });

  await db.activityLog.create({
    data: {
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      entityType: "TASK",
      entityId: task.id,
      action: hasAssignmentChanges ? "ASSIGNED" : "STATUS_CHANGED",
      message:
        hasAssignmentChanges
          ? `Updated assignees for task ${task.title}`
          : `Updated task ${task.title}`,
    },
  });

  const newAssignments = task.assignees.filter((assignment) => addedAssigneeIds.includes(assignment.membershipId));

  if (newAssignments.length > 0) {
    const env = getEnv();

    await Promise.all([
      ...newAssignments.map((assignment) =>
        createNotification({
          workspaceId: input.workspaceId,
          userId: assignment.membership.user.id,
          type: "TASK_REASSIGNMENT",
          title: "Task reassigned",
          body: task.title,
          link: `/tasks/${task.id}`,
        }),
      ),
      ...newAssignments.map((assignment) =>
        sendTaskAssignmentEmail({
          to: assignment.membership.user.email,
          fullName:
            assignment.membership.user.fullName ??
            assignment.membership.user.name ??
            assignment.membership.user.email,
          taskTitle: task.title,
          projectName: task.project.name,
          dueDate: formatDate(task.dueDate),
          taskUrl: `${env.APP_URL}/tasks/${task.id}`,
          reassigned: true,
        }),
      ),
    ]);
  }

  return task;
}

export async function updateTaskContent(input: {
  workspaceId: string;
  taskId: string;
  actorUserId: string;
  title: string;
  description?: string;
}) {
  const existing = await getTaskEditContext(input.taskId, input.workspaceId);

  const task = await db.task.update({
    where: {
      id: input.taskId,
    },
    data: {
      title: input.title,
      description: input.description || null,
    },
    select: {
      id: true,
      projectId: true,
      title: true,
    },
  });

  await db.activityLog.create({
    data: {
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      entityType: "TASK",
      entityId: task.id,
      action: "UPDATED",
      message:
        existing.title !== task.title ? `Renamed task ${task.title}` : `Updated task details for ${task.title}`,
      metadata: {
        projectId: task.projectId,
      },
    },
  });

  return task;
}

export async function addTaskComment(input: {
  workspaceId: string;
  taskId: string;
  authorMembershipId: string;
  actorUserId: string;
  body: string;
  attachments?: File[];
}) {
  await db.task.findFirstOrThrow({
    where: {
      id: input.taskId,
      workspaceId: input.workspaceId,
      isArchived: false,
    },
    select: {
      id: true,
    },
  });

  const comment = await db.taskComment.create({
    data: {
      taskId: input.taskId,
      authorMembershipId: input.authorMembershipId,
      body: input.body,
    },
  });

  await db.activityLog.create({
    data: {
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      entityType: "COMMENT",
      entityId: comment.id,
      action: "COMMENTED",
      message: "Added a task comment",
      metadata: {
        taskId: input.taskId,
      },
    },
  });

  const storedAttachments = await persistCommentAttachments(comment.id, input.attachments ?? []);

  if (storedAttachments.length > 0) {
    await db.taskComment.update({
      where: {
        id: comment.id,
      },
      data: {
        attachments: {
          create: storedAttachments,
        },
      },
    });
  }

  return comment;
}

export async function getTaskCommentEditContext(commentId: string, workspaceId: string) {
  return db.taskComment.findFirstOrThrow({
    where: {
      id: commentId,
      task: {
        workspaceId,
        isArchived: false,
      },
    },
    select: {
      id: true,
      taskId: true,
      authorMembershipId: true,
      body: true,
    },
  });
}

export async function updateTaskComment(input: {
  workspaceId: string;
  commentId: string;
  actorUserId: string;
  body: string;
}) {
  const existing = await getTaskCommentEditContext(input.commentId, input.workspaceId);

  const comment = await db.taskComment.update({
    where: {
      id: existing.id,
    },
    data: {
      body: input.body,
    },
    select: {
      id: true,
      taskId: true,
      body: true,
    },
  });

  await db.activityLog.create({
    data: {
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      entityType: "COMMENT",
      entityId: comment.id,
      action: "UPDATED",
      message: "Updated a task comment",
      metadata: {
        taskId: comment.taskId,
      },
    },
  });

  return comment;
}

export async function deleteTaskComment(input: {
  workspaceId: string;
  commentId: string;
  actorUserId: string;
}) {
  const existing = await getTaskCommentEditContext(input.commentId, input.workspaceId);

  const comment = await db.taskComment.delete({
    where: {
      id: existing.id,
    },
    select: {
      id: true,
      taskId: true,
    },
  });

  await db.activityLog.create({
    data: {
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      entityType: "COMMENT",
      entityId: comment.id,
      action: "UPDATED",
      message: "Deleted a task comment",
      metadata: {
        taskId: comment.taskId,
      },
    },
  });

  return comment;
}

export async function deleteTask(input: {
  workspaceId: string;
  taskId: string;
  actorUserId: string;
}) {
  const existing = await db.task.findFirstOrThrow({
    where: {
      id: input.taskId,
      workspaceId: input.workspaceId,
      isArchived: false,
    },
    select: {
      id: true,
      projectId: true,
      title: true,
    },
  });

  const task = await db.task.update({
    where: {
      id: existing.id,
    },
    data: {
      isArchived: true,
    },
    select: {
      id: true,
      projectId: true,
      title: true,
    },
  });

  await db.activityLog.create({
    data: {
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      entityType: "TASK",
      entityId: task.id,
      action: "ARCHIVED",
      message: `Archived task ${task.title}`,
      metadata: {
        projectId: task.projectId,
      },
    },
  });

  return task;
}
