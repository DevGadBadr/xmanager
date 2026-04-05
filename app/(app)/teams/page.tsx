import { DeleteTeamButton } from "@/components/forms/delete-team-button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentMembership } from "@/modules/auth/server";
import { listWorkspaceMembershipOptions } from "@/modules/memberships/service";
import { listTeams } from "@/modules/teams/service";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const membership = await requireCurrentMembership();
  const [teams, memberships] = await Promise.all([
    listTeams(membership.workspaceId),
    listWorkspaceMembershipOptions(membership.workspaceId),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        action={<CreateTeamDialog memberships={memberships} />}
        description="Create teams, assign managers, and keep delivery groups visible."
        title="Teams"
      />

      {teams.length === 0 ? (
        <EmptyState
          description="Create the first team to start structuring membership around responsibilities."
          title="No teams yet"
        />
      ) : (
        <div className="space-y-4">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle>{team.name}</CardTitle>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {team.description || "No description added."}
                    </p>
                  </div>
                  <DeleteTeamButton teamId={team.id} teamName={team.name} />
                </div>
                <Badge variant="neutral">{team.members.length} members</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Manager: {team.manager?.user.fullName ?? team.manager?.user.email ?? "Not assigned"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
