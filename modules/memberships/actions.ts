"use server";

import { revalidatePath } from "next/cache";

import { initialActionState, type ActionState } from "@/lib/action-state";
import { getFormValue } from "@/lib/forms";
import { requireCurrentMembership } from "@/modules/auth/server";
import { removeWorkspaceMember } from "@/modules/memberships/service";

export async function deleteWorkspaceMemberAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const membership = await requireCurrentMembership();

    if (membership.role !== "OWNER") {
      throw new Error("Only the workspace owner can delete users.");
    }

    await removeWorkspaceMember({
      membershipId: getFormValue(formData, "membershipId"),
      workspaceId: membership.workspaceId,
      actorUserId: membership.userId,
    });

    revalidatePath("/users");
    revalidatePath("/teams");
    revalidatePath("/projects");

    return {
      status: "success",
      message: "User removed from the workspace.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to remove user.",
    };
  }
}
