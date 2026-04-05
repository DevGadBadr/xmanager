"use server";

import { revalidatePath } from "next/cache";

import { initialActionState, type ActionState } from "@/lib/action-state";
import { getFormValue } from "@/lib/forms";
import { assertPermission, can } from "@/lib/rbac";
import { requireCurrentMembership } from "@/modules/auth/server";
import {
  taskCommentSchema,
  taskCommentDeleteSchema,
  taskCommentUpdateSchema,
  taskContentUpdateSchema,
  taskDeleteSchema,
  taskSchema,
  taskUpdateSchema,
} from "@/modules/tasks/schemas";
import {
  addTaskComment,
  deleteTaskComment,
  createTask,
  deleteTask,
  getTaskCommentEditContext,
  getTaskEditContext,
  updateTask,
  updateTaskComment,
  updateTaskContent,
} from "@/modules/tasks/service";

export async function createTaskAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const membership = await requireCurrentMembership();
    assertPermission(membership.role, "tasks:create");

    const values = taskSchema.parse({
      projectId: getFormValue(formData, "projectId"),
      title: getFormValue(formData, "title"),
      description: getFormValue(formData, "description"),
      priority: getFormValue(formData, "priority"),
      assigneeMembershipIds: getFormValues(formData, "assigneeMembershipIds"),
      startDate: getFormValue(formData, "startDate"),
      dueDate: getFormValue(formData, "dueDate"),
    });

    await createTask({
      workspaceId: membership.workspaceId,
      projectId: values.projectId,
      creatorMembershipId: membership.id,
      actorUserId: membership.userId,
      title: values.title,
      description: values.description,
      priority: values.priority,
      assigneeMembershipIds: values.assigneeMembershipIds,
      startDate: values.startDate,
      dueDate: values.dueDate,
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${values.projectId}`);

    return {
      status: "success",
      message: "Task created.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to create task.",
    };
  }
}

export async function updateTaskAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const membership = await requireCurrentMembership();
    assertPermission(membership.role, "tasks:manage");

    const values = taskUpdateSchema.parse({
      taskId: getFormValue(formData, "taskId"),
      status: getFormValue(formData, "status"),
      priority: getFormValue(formData, "priority"),
      assigneeMembershipIds: getFormValues(formData, "assigneeMembershipIds"),
      startDate: getFormValue(formData, "startDate"),
      dueDate: getFormValue(formData, "dueDate"),
    });

    const task = await updateTask({
      workspaceId: membership.workspaceId,
      taskId: values.taskId,
      actorUserId: membership.userId,
      status: values.status,
      priority: values.priority,
      assigneeMembershipIds: values.assigneeMembershipIds,
      startDate: values.startDate,
      dueDate: values.dueDate,
    });

    revalidatePath(`/tasks/${task.id}`);
    revalidatePath("/projects");
    revalidatePath(`/projects/${task.projectId}`);

    return {
      status: "success",
      message: "Task updated.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to update task.",
    };
  }
}

function getFormValues(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string" && value.length > 0);
}

export async function updateTaskContentAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const membership = await requireCurrentMembership();
    const values = taskContentUpdateSchema.parse({
      taskId: getFormValue(formData, "taskId"),
      title: getFormValue(formData, "title"),
      description: getFormValue(formData, "description"),
    });

    const taskContext = await getTaskEditContext(values.taskId, membership.workspaceId);
    const canEditContent = can(membership.role, "tasks:manage") || taskContext.creatorMembershipId === membership.id;

    if (!canEditContent) {
      throw new Error("Only the task creator or a manager can update the title and description.");
    }

    const task = await updateTaskContent({
      workspaceId: membership.workspaceId,
      taskId: values.taskId,
      actorUserId: membership.userId,
      title: values.title,
      description: values.description,
    });

    revalidatePath(`/tasks/${task.id}`);
    revalidatePath("/projects");
    revalidatePath(`/projects/${task.projectId}`);

    return {
      status: "success",
      message: "Task details updated.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to update task details.",
    };
  }
}

export async function addTaskCommentAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const membership = await requireCurrentMembership();

    const values = taskCommentSchema.parse({
      taskId: getFormValue(formData, "taskId"),
      body: getFormValue(formData, "body"),
    });
    const attachments = formData
      .getAll("attachments")
      .filter((value): value is File => value instanceof File && value.size > 0);

    await addTaskComment({
      workspaceId: membership.workspaceId,
      taskId: values.taskId,
      authorMembershipId: membership.id,
      actorUserId: membership.userId,
      body: values.body,
      attachments,
    });

    revalidatePath(`/tasks/${values.taskId}`);
    revalidatePath("/projects");

    return {
      status: "success",
      message: "Comment added.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to add comment.",
    };
  }
}

export async function updateTaskCommentAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const membership = await requireCurrentMembership();
    const values = taskCommentUpdateSchema.parse({
      commentId: getFormValue(formData, "commentId"),
      body: getFormValue(formData, "body"),
    });

    const commentContext = await getTaskCommentEditContext(values.commentId, membership.workspaceId);

    if (commentContext.authorMembershipId !== membership.id) {
      throw new Error("Only the commenter can edit this comment.");
    }

    const comment = await updateTaskComment({
      workspaceId: membership.workspaceId,
      commentId: values.commentId,
      actorUserId: membership.userId,
      body: values.body,
    });

    revalidatePath(`/tasks/${comment.taskId}`);
    revalidatePath("/projects");

    return {
      status: "success",
      message: "Comment updated.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to update comment.",
    };
  }
}

export async function deleteTaskCommentAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const membership = await requireCurrentMembership();
    const values = taskCommentDeleteSchema.parse({
      commentId: getFormValue(formData, "commentId"),
    });

    const commentContext = await getTaskCommentEditContext(values.commentId, membership.workspaceId);

    if (commentContext.authorMembershipId !== membership.id) {
      throw new Error("Only the commenter can delete this comment.");
    }

    const comment = await deleteTaskComment({
      workspaceId: membership.workspaceId,
      commentId: values.commentId,
      actorUserId: membership.userId,
    });

    revalidatePath(`/tasks/${comment.taskId}`);
    revalidatePath("/projects");

    return {
      status: "success",
      message: "Comment deleted.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to delete comment.",
    };
  }
}

export async function deleteTaskAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const membership = await requireCurrentMembership();
    assertPermission(membership.role, "tasks:manage");

    const values = taskDeleteSchema.parse({
      taskId: getFormValue(formData, "taskId"),
    });

    const task = await deleteTask({
      workspaceId: membership.workspaceId,
      taskId: values.taskId,
      actorUserId: membership.userId,
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${task.projectId}`);
    revalidatePath(`/tasks/${task.id}`);

    return {
      status: "success",
      message: "Task deleted.",
      redirectTo: `/projects/${task.projectId}`,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to delete task.",
    };
  }
}
