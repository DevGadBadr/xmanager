import { DeleteTeamButton } from "@/components/forms/delete-team-button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { EditTeamDialog } from "@/components/teams/edit-team-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { can } from "@/lib/rbac";
import { getInitials } from "@/lib/utils";
import { requireCurrentMembership } from "@/modules/auth/server";
import { listWorkspaceMembershipOptions } from "@/modules/memberships/service";
import { listTeams } from "@/modules/teams/service";
import { ChevronDown } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const membership = await requireCurrentMembership();
  const [teams, memberships] = await Promise.all([
    listTeams(membership.workspaceId),
    listWorkspaceMembershipOptions(membership.workspaceId),
  ]);
  const membershipsById = new Map(memberships.map((item) => [item.id, item]));

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
          {teams.map((team) => {
            const teamMembers = team.members
              .map((memberLink) => membershipsById.get(memberLink.membershipId))
              .filter((member) => member !== undefined)
              .sort((left, right) => {
                const leftLabel = left.user.fullName ?? left.user.email;
                const rightLabel = right.user.fullName ?? right.user.email;

                return leftLabel.localeCompare(rightLabel);
              });
            const canManageTeam = can(membership.role, "teams:manage") || team.creatorMembershipId === membership.id;

            return (
              <Card key={team.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle>{team.name}</CardTitle>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {team.description || "No description added."}
                    </p>
                  </div>
                  {canManageTeam ? (
                    <div className="flex items-center gap-2">
                      <EditTeamDialog description={team.description} name={team.name} teamId={team.id} />
                      <DeleteTeamButton teamId={team.id} teamName={team.name} />
                    </div>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Manager: {team.manager?.user.fullName ?? team.manager?.user.email ?? "Not assigned"}
                  </p>

                  <details className="group rounded-xl border border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-950/40">
                    <summary className="flex list-none items-center justify-between gap-3 px-3 py-2 text-sm font-medium text-zinc-700 [&::-webkit-details-marker]:hidden dark:text-zinc-200">
                      <div className="flex items-center gap-2">
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
                        <span>{teamMembers.length} members</span>
                      </div>
                    </summary>

                    <div className="border-t border-zinc-200 px-3 py-3 dark:border-zinc-800">
                      {teamMembers.length === 0 ? (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          No members assigned to this team yet.
                        </p>
                      ) : (
                        <ul className="space-y-3">
                          {teamMembers.map((member) => {
                            const label = member.user.fullName ?? member.user.email;

                            return (
                              <li
                                key={member.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarFallback>{getInitials(label)}</AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                                      {label}
                                    </p>
                                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                                      {member.user.email}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  {team.managerMembershipId === member.id ? (
                                    <Badge variant="default">Manager</Badge>
                                  ) : null}
                                  <Badge variant="neutral">{member.role}</Badge>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </details>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
