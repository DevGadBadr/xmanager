"use server";

import { revalidatePath } from "next/cache";

import { initialActionState, type ActionState } from "@/lib/action-state";
import { getFormValue } from "@/lib/forms";
import { assertPermission } from "@/lib/rbac";
import { requireCurrentMembership } from "@/modules/auth/server";
import { projectContentUpdateSchema, projectDeleteSchema, projectSchema } from "@/modules/projects/schemas";
import { createProject, deleteProject, getProjectEditContext, updateProjectContent } from "@/modules/projects/service";

export async function createProjectAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const membership = await requireCurrentMembership();
    assertPermission(membership.role, "projects:create");

    const values = projectSchema.parse({
      name: getFormValue(formData, "name"),
      key: getFormValue(formData, "key").toUpperCase(),
      description: getFormValue(formData, "description"),
      status: getFormValue(formData, "status"),
      dueDate: getFormValue(formData, "dueDate"),
    });

    await createProject({
      workspaceId: membership.workspaceId,
      ownerMembershipId: membership.id,
      actorUserId: membership.userId,
      name: values.name,
      key: values.key,
      description: values.description,
      status: values.status,
      dueDate: values.dueDate,
    });

    revalidatePath("/projects");

    return {
      status: "success",
      message: "Project created.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to create project.",
    };
  }
}

export async function updateProjectContentAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const membership = await requireCurrentMembership();
    const values = projectContentUpdateSchema.parse({
      projectId: getFormValue(formData, "projectId"),
      name: getFormValue(formData, "name"),
      description: getFormValue(formData, "description"),
    });

    const projectContext = await getProjectEditContext(values.projectId, membership.workspaceId);
    const canEditContent =
      projectContext.ownerMembershipId === membership.id || membership.role === "OWNER" || membership.role === "ADMIN";

    if (!canEditContent) {
      throw new Error("Only the project creator or an admin can update the project name and description.");
    }

    const project = await updateProjectContent({
      workspaceId: membership.workspaceId,
      projectId: values.projectId,
      actorUserId: membership.userId,
      name: values.name,
      description: values.description,
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${project.id}`);

    return {
      status: "success",
      message: "Project details updated.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to update project details.",
    };
  }
}

export async function deleteProjectAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const membership = await requireCurrentMembership();
    const values = projectDeleteSchema.parse({
      projectId: getFormValue(formData, "projectId"),
    });

    const projectContext = await getProjectEditContext(values.projectId, membership.workspaceId);
    const canDeleteProject =
      projectContext.ownerMembershipId === membership.id || membership.role === "OWNER" || membership.role === "ADMIN";

    if (!canDeleteProject) {
      throw new Error("Only the project creator, an admin, or the workspace owner can delete this project.");
    }

    const project = await deleteProject({
      workspaceId: membership.workspaceId,
      projectId: values.projectId,
      actorUserId: membership.userId,
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${project.id}`);

    return {
      status: "success",
      message: "Project deleted.",
      redirectTo: "/projects",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to delete project.",
    };
  }
}
