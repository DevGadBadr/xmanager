"use server";

import { revalidatePath } from "next/cache";

import { type ActionState, initialActionState } from "@/lib/action-state";
import { getFormValue } from "@/lib/forms";
import { requireCurrentUser } from "@/modules/auth/server";
import { avatarUrlSchema, updateProfileSchema } from "@/modules/profile/schemas";
import {
  applyGoogleProfileAvatar,
  removeProfileAvatar,
  unlinkGoogleAccount,
  updateProfileAvatarUrl,
  updateProfileDetails,
  uploadProfileAvatar,
} from "@/modules/profile/service";

function revalidateProfileViews() {
  revalidatePath("/profile");
  revalidatePath("/users");
}

export async function updateProfileAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const user = await requireCurrentUser();
    const values = updateProfileSchema.parse({
      fullName: getFormValue(formData, "fullName"),
      title: getFormValue(formData, "title"),
      department: getFormValue(formData, "department"),
    });

    await updateProfileDetails({
      userId: user.id,
      department: values.department,
      fullName: values.fullName,
      title: values.title,
    });
    revalidateProfileViews();

    return {
      status: "success",
      message: "Profile details updated.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to update your profile.",
    };
  }
}

export async function saveAvatarUrlAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const user = await requireCurrentUser();
    const values = avatarUrlSchema.parse({
      avatarUrl: getFormValue(formData, "avatarUrl"),
    });

    await updateProfileAvatarUrl({
      userId: user.id,
      avatarUrl: values.avatarUrl || null,
    });
    revalidateProfileViews();

    return {
      status: "success",
      message: values.avatarUrl ? "Avatar URL saved." : "Avatar URL cleared.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to update your avatar URL.",
    };
  }
}

export async function uploadAvatarAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;

  try {
    const user = await requireCurrentUser();
    const file = formData.get("avatar");

    if (!(file instanceof File)) {
      throw new Error("Choose an image before uploading.");
    }

    await uploadProfileAvatar({
      userId: user.id,
      file,
    });
    revalidateProfileViews();

    return {
      status: "success",
      message: `${file.name || "Avatar"} uploaded and applied.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to upload your avatar.",
    };
  }
}

export async function removeAvatarAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;
  void formData;

  try {
    const user = await requireCurrentUser();
    await removeProfileAvatar(user.id);
    revalidateProfileViews();

    return {
      status: "success",
      message: "Avatar removed.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to remove your avatar.",
    };
  }
}

export async function importGoogleAvatarAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;
  void formData;

  try {
    const user = await requireCurrentUser();
    await applyGoogleProfileAvatar(user.id);
    revalidateProfileViews();

    return {
      status: "success",
      message: "Google profile photo applied.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to use your Google profile photo.",
    };
  }
}

export async function unlinkGoogleAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;
  void formData;

  try {
    const user = await requireCurrentUser();
    await unlinkGoogleAccount(user.id);
    revalidateProfileViews();

    return {
      status: "success",
      message: "Google sign-in removed from your account.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to unlink Google right now.",
    };
  }
}
