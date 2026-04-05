import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { AVATAR_MIME_TO_EXTENSION, validateAvatarUploadFile } from "@/lib/avatar-rules";

const USER_AVATARS_ROOT = path.join(process.cwd(), "public", "uploads", "user-avatars");
const USER_AVATAR_PUBLIC_PREFIX = "/uploads/user-avatars";

export function isLocalUserAvatarPath(value?: string | null) {
  return Boolean(value?.startsWith(USER_AVATAR_PUBLIC_PREFIX));
}

export async function persistUserAvatar(userId: string, file: File) {
  const validationError = validateAvatarUploadFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const extension =
    path.extname(sanitizeFileName(file.name)) ||
    AVATAR_MIME_TO_EXTENSION[file.type as keyof typeof AVATAR_MIME_TO_EXTENSION] ||
    ".png";
  const storedFileName = `avatar-${randomUUID()}${extension}`;
  const userDirectory = path.join(USER_AVATARS_ROOT, userId);
  const absoluteFilePath = path.join(userDirectory, storedFileName);
  const relativeFilePath = path.posix.join(USER_AVATAR_PUBLIC_PREFIX, userId, storedFileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await mkdir(userDirectory, { recursive: true });
  await writeFile(absoluteFilePath, buffer);

  return relativeFilePath;
}

export async function removeStoredUserAvatarIfOwned(imagePath?: string | null) {
  if (!imagePath || !isLocalUserAvatarPath(imagePath)) {
    return;
  }

  const normalizedImagePath = imagePath.replace(/^\//, "");
  const absoluteFilePath = path.join(process.cwd(), "public", normalizedImagePath);
  const normalizedAvatarRoot = path.normalize(USER_AVATARS_ROOT);
  const normalizedFilePath = path.normalize(absoluteFilePath);

  if (!normalizedFilePath.startsWith(normalizedAvatarRoot)) {
    return;
  }

  try {
    await unlink(normalizedFilePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

function sanitizeFileName(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "avatar";
  }

  return trimmedValue.replace(/[^a-zA-Z0-9._-]/g, "-");
}
