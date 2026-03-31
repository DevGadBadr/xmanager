import type {
  NotificationChannel,
  NotificationType,
  Prisma,
} from "@prisma/client";

import { db } from "@/lib/db";

type CreateNotificationInput = {
  workspaceId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  payload?: Prisma.InputJsonValue;
  channel?: NotificationChannel;
  sentAt?: Date | null;
};

export async function createNotification(input: CreateNotificationInput) {
  return db.notification.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
      payload: input.payload,
      channel: input.channel ?? "IN_APP",
      sentAt: input.sentAt ?? null,
    },
  });
}

export async function listNotifications(userId: string, workspaceId: string) {
  return db.notification.findMany({
    where: {
      userId,
      workspaceId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return db.notification.count({
    where: {
      userId,
      readAt: null,
    },
  });
}

export async function markNotificationsRead(userId: string) {
  await db.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
}
