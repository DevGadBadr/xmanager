"use server";

import { revalidatePath } from "next/cache";

import { initialActionState, type ActionState } from "@/lib/action-state";
import { getFormValue } from "@/lib/forms";
import { assertPermission } from "@/lib/rbac";
import { requireCurrentMembership } from "@/modules/auth/server";
import { folderSchema } from "@/modules/folders/schemas";
import { createFolder } from "@/modules/folders/service";

export async function createFolderAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const membership = await requireCurrentMembership();
    assertPermission(membership.role, "projects:manage");

    const values = folderSchema.parse({
      name: getFormValue(formData, "name"),
      scope: getFormValue(formData, "scope"),
      parentFolderId: getFormValue(formData, "parentFolderId") || undefined,
    });

    await createFolder({
      workspaceId: membership.workspaceId,
      actorUserId: membership.userId,
      name: values.name,
      scope: values.scope,
      parentFolderId: values.parentFolderId || null,
    });

    revalidatePath("/projects");

    return {
      status: "success",
      message: "Folder created.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to create folder.",
    };
  }
}
