import type {
  ActivityAction,
  ActivityEntityType,
  Prisma,
} from "@prisma/client";

import { db } from "@/lib/db";

type LogActivityInput = {
  workspaceId: string;
  actorUserId?: string | null;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  message: string;
  metadata?: Prisma.InputJsonValue;
};

export async function logActivity(input: LogActivityInput) {
  return db.activityLog.create({
    data: {
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      message: input.message,
      metadata: input.metadata,
    },
  });
}

export async function listRecentActivity(workspaceId: string, limit = 12) {
  return db.activityLog.findMany({
    where: {
      workspaceId,
    },
    include: {
      actor: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}
