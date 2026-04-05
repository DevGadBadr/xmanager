import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const ATTACHMENTS_ROOT = path.join(process.cwd(), "public", "uploads", "task-comment-attachments");
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

export type StoredCommentAttachment = {
  fileName: string;
  filePath: string;
  mimeType: string | null;
  size: number;
};

export async function persistCommentAttachments(commentId: string, files: File[]) {
  const validFiles = files.filter((file) => file.size > 0);

  if (validFiles.length === 0) {
    return [];
  }

  await mkdir(path.join(ATTACHMENTS_ROOT, commentId), { recursive: true });

  const storedAttachments: StoredCommentAttachment[] = [];

  for (const file of validFiles) {
    if (file.size > MAX_ATTACHMENT_SIZE) {
      throw new Error(`"${file.name}" is larger than 10 MB.`);
    }

    const sanitizedName = sanitizeFileName(file.name);
    const extension = path.extname(sanitizedName);
    const baseName = path.basename(sanitizedName, extension);
    const storedFileName = `${baseName}-${randomUUID()}${extension}`;
    const relativeFilePath = path.posix.join("/uploads/task-comment-attachments", commentId, storedFileName);
    const absoluteFilePath = path.join(ATTACHMENTS_ROOT, commentId, storedFileName);
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(absoluteFilePath, buffer);

    storedAttachments.push({
      fileName: sanitizedName,
      filePath: relativeFilePath,
      mimeType: file.type || null,
      size: file.size,
    });
  }

  return storedAttachments;
}

function sanitizeFileName(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return `attachment-${randomUUID()}`;
  }

  return trimmedValue.replace(/[^a-zA-Z0-9._-]/g, "-");
}
