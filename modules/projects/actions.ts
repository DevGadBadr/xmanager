"use server";

import { revalidatePath } from "next/cache";

import { initialActionState, type ActionState } from "@/lib/action-state";
import { getFormValue } from "@/lib/forms";
import { assertPermission } from "@/lib/rbac";
import { requireCurrentMembership } from "@/modules/auth/server";
import { projectSchema } from "@/modules/projects/schemas";
import { createProject } from "@/modules/projects/service";

export async function createProjectAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const membership = await requireCurrentMembership();
    assertPermission(membership.role, "projects:create");

    const values = projectSchema.parse({
      folderId: getFormValue(formData, "folderId") || undefined,
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
      folderId: values.folderId || null,
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
