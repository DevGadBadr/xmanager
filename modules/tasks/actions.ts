"use server";

import { revalidatePath } from "next/cache";

import { initialActionState, type ActionState } from "@/lib/action-state";
import { getFormValue } from "@/lib/forms";
import { assertPermission } from "@/lib/rbac";
import { requireCurrentMembership } from "@/modules/auth/server";
import {
  taskCommentSchema,
  taskSchema,
  taskUpdateSchema,
} from "@/modules/tasks/schemas";
import { addTaskComment, createTask, updateTask } from "@/modules/tasks/service";

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
      assigneeMembershipId: getFormValue(formData, "assigneeMembershipId") || undefined,
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
      assigneeMembershipId: values.assigneeMembershipId || null,
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
      assigneeMembershipId: getFormValue(formData, "assigneeMembershipId") || undefined,
      startDate: getFormValue(formData, "startDate"),
      dueDate: getFormValue(formData, "dueDate"),
    });

    const task = await updateTask({
      workspaceId: membership.workspaceId,
      taskId: values.taskId,
      actorUserId: membership.userId,
      status: values.status,
      priority: values.priority,
      assigneeMembershipId: values.assigneeMembershipId || null,
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

    await addTaskComment({
      workspaceId: membership.workspaceId,
      taskId: values.taskId,
      authorMembershipId: membership.id,
      actorUserId: membership.userId,
      body: values.body,
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
