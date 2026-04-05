"use server";

import { revalidatePath } from "next/cache";

import { initialActionState, type ActionState } from "@/lib/action-state";
import { getFormValue } from "@/lib/forms";
import { assertPermission } from "@/lib/rbac";
import { requireCurrentMembership } from "@/modules/auth/server";
import { teamSchema } from "@/modules/teams/schemas";
import { createTeam, deleteTeam } from "@/modules/teams/service";

export async function createTeamAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const membership = await requireCurrentMembership();
    assertPermission(membership.role, "teams:manage");

    const values = teamSchema.parse({
      name: getFormValue(formData, "name"),
      description: getFormValue(formData, "description"),
      managerMembershipId: getFormValue(formData, "managerMembershipId") || undefined,
    });

    await createTeam({
      workspaceId: membership.workspaceId,
      actorUserId: membership.userId,
      name: values.name,
      description: values.description,
      managerMembershipId: values.managerMembershipId || null,
    });

    revalidatePath("/teams");

    return {
      status: "success",
      message: "Team created.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to create team.",
    };
  }
}

export async function deleteTeamAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const membership = await requireCurrentMembership();
    assertPermission(membership.role, "teams:manage");

    await deleteTeam({
      teamId: getFormValue(formData, "teamId"),
      workspaceId: membership.workspaceId,
      actorUserId: membership.userId,
    });

    revalidatePath("/teams");
    revalidatePath("/users");

    return {
      status: "success",
      message: "Team removed.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to remove team.",
    };
  }
}
