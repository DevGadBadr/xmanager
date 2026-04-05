"use server";

import { type ActionState, initialActionState } from "@/lib/action-state";
import { getFormValue } from "@/lib/forms";
import { passwordResetConfirmSchema, passwordResetRequestSchema } from "@/modules/password-reset/schemas";
import { requestPasswordReset, resetPasswordWithCode } from "@/modules/password-reset/service";

export async function requestPasswordResetAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const values = passwordResetRequestSchema.parse({
      email: getFormValue(formData, "email"),
    });

    await requestPasswordReset(values.email);

    return {
      status: "success",
      message: "If that workspace account exists, a reset code has been sent to its invited email.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to send a reset code right now.",
    };
  }
}

export async function confirmPasswordResetAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const values = passwordResetConfirmSchema.parse({
      email: getFormValue(formData, "email"),
      code: getFormValue(formData, "code"),
      password: getFormValue(formData, "password"),
      confirmPassword: getFormValue(formData, "confirmPassword"),
    });

    await resetPasswordWithCode({
      code: values.code,
      email: values.email,
      password: values.password,
    });

    return {
      status: "success",
      message: "Password updated. Use it the next time you sign in.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to reset your password.",
    };
  }
}
