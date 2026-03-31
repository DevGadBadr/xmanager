import Link from "next/link";

import { ActivityFeed } from "@/components/shared/activity-feed";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { requireCurrentMembership } from "@/modules/auth/server";
import { getDashboardData } from "@/modules/workspace/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const membership = await requireCurrentMembership();
  const dashboard = await getDashboardData(membership.workspaceId, membership.id);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Overview of active work, team coverage, and recent activity."
        title="Dashboard"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard description="Projects currently scoped in the workspace." title="Projects" value={dashboard.projectCount} />
        <StatCard description="Configured delivery teams." title="Teams" value={dashboard.teamCount} />
        <StatCard description="Tasks that still need action." title="Open tasks" value={dashboard.openTaskCount} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Assigned to you</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.assignedTasks.map((task) => (
              <Link
                className="block rounded-xl border border-zinc-200 p-4 transition hover:border-indigo-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-indigo-500/30 dark:hover:bg-zinc-800/50"
                href={`/tasks/${task.id}`}
                key={task.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-950 dark:text-zinc-50">{task.title}</p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{task.project.name}</p>
                  </div>
                  <Badge
                    variant={
                      task.priority === "URGENT"
                        ? "danger"
                        : task.priority === "HIGH"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {task.priority}
                  </Badge>
                </div>
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                  Due {formatDate(task.dueDate)}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <ActivityFeed items={dashboard.recentActivity} />
      </div>
    </div>
  );
}
