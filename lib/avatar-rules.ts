export const MAX_AVATAR_FILE_SIZE = 4 * 1024 * 1024;
export const ALLOWED_AVATAR_MIME_TYPES = ["image/gif", "image/jpeg", "image/png", "image/webp"] as const;
export const AVATAR_UPLOAD_ACCEPT = ALLOWED_AVATAR_MIME_TYPES.join(",");

export const AVATAR_MIME_TO_EXTENSION: Record<(typeof ALLOWED_AVATAR_MIME_TYPES)[number], string> = {
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const allowedAvatarMimeTypeSet = new Set<string>(ALLOWED_AVATAR_MIME_TYPES);

export function isSupportedAvatarMimeType(value: string) {
  return allowedAvatarMimeTypeSet.has(value);
}

export function validateAvatarUploadFile(file: { size: number; type: string }) {
  if (file.size <= 0) {
    return "Choose an image before saving your avatar.";
  }

  if (file.size > MAX_AVATAR_FILE_SIZE) {
    return "Avatar images must be 4 MB or smaller.";
  }

  if (!isSupportedAvatarMimeType(file.type)) {
    return "Use a PNG, JPG, WEBP, or GIF image for your avatar.";
  }

  return null;
}
