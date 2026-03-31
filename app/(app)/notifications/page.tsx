import { MarkNotificationsReadButton } from "@/components/shared/mark-notifications-read-button";
import { NotificationList } from "@/components/shared/notification-list";
import { PageHeader } from "@/components/shared/page-header";
import { requireCurrentMembership } from "@/modules/auth/server";
import { listNotifications } from "@/modules/notifications/service";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const membership = await requireCurrentMembership();
  const notifications = await listNotifications(membership.userId, membership.workspaceId);

  return (
    <div className="space-y-6">
      <PageHeader
        action={<MarkNotificationsReadButton />}
        description="In-app delivery of task, team, and access updates."
        title="Notifications"
      />
      <NotificationList items={notifications} />
    </div>
  );
}
