import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { requireCurrentMembership } from "@/modules/auth/server";
import { getWorkspaceSettings } from "@/modules/workspace/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const membership = await requireCurrentMembership();
  const workspace = await getWorkspaceSettings(membership.workspaceId);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Workspace-level details and defaults."
        title="Settings"
      />

      <Card>
        <CardHeader>
          <CardTitle>Workspace profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Name</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{workspace.name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Owner</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {workspace.owner.fullName ?? workspace.owner.email}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Created</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{formatDate(workspace.createdAt)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
