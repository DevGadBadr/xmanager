import type { FolderScope } from "@prisma/client";

import { db } from "@/lib/db";

export async function listFolders(workspaceId: string, scope: FolderScope) {
  return db.folder.findMany({
    where: {
      workspaceId,
      scope,
      isArchived: false,
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        name: "asc",
      },
    ],
  });
}

export async function createFolder(input: {
  workspaceId: string;
  actorUserId: string;
  name: string;
  scope: FolderScope;
  parentFolderId?: string | null;
}) {
  void input.actorUserId;

  if (input.parentFolderId) {
    const parent = await db.folder.findFirst({
      where: {
        id: input.parentFolderId,
        workspaceId: input.workspaceId,
        scope: input.scope,
        isArchived: false,
      },
      select: {
        id: true,
      },
    });

    if (!parent) {
      throw new Error("Selected parent folder is not available.");
    }
  }

  return db.folder.create({
    data: {
      workspaceId: input.workspaceId,
      name: input.name,
      scope: input.scope,
      parentFolderId: input.parentFolderId || null,
    },
  });
}
