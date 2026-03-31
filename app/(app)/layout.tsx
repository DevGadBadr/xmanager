import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { getUnreadNotificationCount } from "@/modules/notifications/service";
import { requireCurrentMembership } from "@/modules/auth/server";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const membership = await requireCurrentMembership();
  const unreadCount = await getUnreadNotificationCount(membership.userId);

  return (
    <div className="flex min-h-screen bg-[#eef2f7] dark:bg-[#0d1117]">
      <AppSidebar workspaceName={membership.workspace.name} />
      <div className="flex min-h-screen flex-1 flex-col">
        <AppTopbar unreadCount={unreadCount} user={membership.user} />
        <main className="flex-1 px-5 py-5 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
