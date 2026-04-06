"use server";

import { revalidatePath } from "next/cache";

import { initialActionState, type ActionState } from "@/lib/action-state";
import { getFormValue } from "@/lib/forms";
import { can } from "@/lib/rbac";
import { requireCurrentMembership } from "@/modules/auth/server";
import { teamContentUpdateSchema, teamDeleteSchema, teamSchema } from "@/modules/teams/schemas";
import { createTeam, deleteTeam, getTeamEditContext, updateTeamContent } from "@/modules/teams/service";

export async function createTeamAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const membership = await requireCurrentMembership();
    if (!can(membership.role, "teams:manage")) {
      throw new Error("Only workspace admins can create teams.");
    }

    const values = teamSchema.parse({
      name: getFormValue(formData, "name"),
      description: getFormValue(formData, "description"),
      managerMembershipId: getFormValue(formData, "managerMembershipId") || undefined,
    });

    await createTeam({
      workspaceId: membership.workspaceId,
      creatorMembershipId: membership.id,
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

export async function updateTeamContentAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const membership = await requireCurrentMembership();
    const values = teamContentUpdateSchema.parse({
      teamId: getFormValue(formData, "teamId"),
      name: getFormValue(formData, "name"),
      description: getFormValue(formData, "description"),
    });

    const teamContext = await getTeamEditContext(values.teamId, membership.workspaceId);
    const canEditTeam = can(membership.role, "teams:manage") || teamContext.creatorMembershipId === membership.id;

    if (!canEditTeam) {
      throw new Error("Only the team creator or a workspace admin can update the team name and description.");
    }

    await updateTeamContent({
      workspaceId: membership.workspaceId,
      teamId: values.teamId,
      actorUserId: membership.userId,
      name: values.name,
      description: values.description,
    });

    revalidatePath("/teams");

    return {
      status: "success",
      message: "Team details updated.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to update team details.",
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
    const values = teamDeleteSchema.parse({
      teamId: getFormValue(formData, "teamId"),
    });

    const teamContext = await getTeamEditContext(values.teamId, membership.workspaceId);
    const canDeleteTeam = can(membership.role, "teams:manage") || teamContext.creatorMembershipId === membership.id;

    if (!canDeleteTeam) {
      throw new Error("Only the team creator or a workspace admin can delete this team.");
    }

    await deleteTeam({
      teamId: values.teamId,
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
