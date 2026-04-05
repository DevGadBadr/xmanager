"use server";

import { revalidatePath } from "next/cache";

import { initialActionState, type ActionState } from "@/lib/action-state";
import { getFormValue } from "@/lib/forms";
import { assertPermission } from "@/lib/rbac";
import { requireCurrentMembership } from "@/modules/auth/server";
import { inviteSchema, onboardingSchema } from "@/modules/invitations/schemas";
import {
  acceptInvitation,
  createInvitation,
  revokeInvitation,
} from "@/modules/invitations/service";

export async function inviteUserAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const membership = await requireCurrentMembership();
    assertPermission(membership.role, "invites:create");

    const values = inviteSchema.parse({
      email: getFormValue(formData, "email"),
      role: getFormValue(formData, "role"),
      teamId: getFormValue(formData, "teamId") || undefined,
    });

    await createInvitation({
      workspaceId: membership.workspaceId,
      invitedByMembershipId: membership.id,
      email: values.email,
      role: values.role,
      teamId: values.teamId || null,
    });

    revalidatePath("/users");

    return {
      status: "success",
      message: "Invitation sent.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to send invite.",
    };
  }
}

export async function completeOnboardingAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const values = onboardingSchema.parse({
      token: getFormValue(formData, "token"),
      fullName: getFormValue(formData, "fullName"),
      title: getFormValue(formData, "title"),
      department: getFormValue(formData, "department"),
      password: getFormValue(formData, "password"),
      confirmPassword: getFormValue(formData, "confirmPassword"),
    });

    await acceptInvitation({
      token: values.token,
      fullName: values.fullName,
      title: values.title,
      department: values.department,
      password: values.password,
    });

    return {
      status: "success",
      message: "Profile completed. Signing you in...",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to complete onboarding.",
    };
  }
}

export async function revokeInvitationAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const membership = await requireCurrentMembership();
    assertPermission(membership.role, "invites:create");

    await revokeInvitation({
      invitationId: getFormValue(formData, "invitationId"),
      workspaceId: membership.workspaceId,
      actorUserId: membership.userId,
    });

    revalidatePath("/users");

    return {
      status: "success",
      message: "Invitation removed.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to remove invitation.",
    };
  }
}
