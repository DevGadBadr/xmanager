import { AppShell } from "@/components/layout/app-shell";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { getUnreadNotificationCount, listNotifications } from "@/modules/notifications/service";
import { requireCurrentMembership } from "@/modules/auth/server";
import { listProjectExplorer } from "@/modules/projects/service";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const membership = await requireCurrentMembership();
  const [unreadCount, notifications, projectExplorer] = await Promise.all([
    getUnreadNotificationCount(membership.userId),
    listNotifications(membership.userId, membership.workspaceId, 8),
    listProjectExplorer(membership.workspaceId),
  ]);

  return (
    <AppShell
      sidebar={
        <AppSidebar
          explorer={projectExplorer}
          storageScope={`${membership.userId}:${membership.workspaceId}`}
          workspaceName={membership.workspace.name}
        />
      }
      topbar={<AppTopbar notifications={notifications} unreadCount={unreadCount} user={membership.user} />}
    >
      {children}
    </AppShell>
  );
}
