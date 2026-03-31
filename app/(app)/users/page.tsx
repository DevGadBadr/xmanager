import { InviteUserDialog } from "@/components/forms/invite-user-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { requireCurrentMembership } from "@/modules/auth/server";
import { listWorkspaceInvitations } from "@/modules/invitations/service";
import { listWorkspaceMembers } from "@/modules/memberships/service";
import { listTeams } from "@/modules/teams/service";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const membership = await requireCurrentMembership();
  const [members, invitations, teams] = await Promise.all([
    listWorkspaceMembers(membership.workspaceId),
    listWorkspaceInvitations(membership.workspaceId),
    listTeams(membership.workspaceId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        action={<InviteUserDialog teams={teams.map((team) => ({ id: team.id, name: team.name }))} />}
        description="Manage workspace membership, roles, and pending invitations."
        title="Users"
      />

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="invites">Pending invites</TabsTrigger>
        </TabsList>
        <TabsContent className="mt-4 space-y-4" value="members">
          {members.map((member) => (
            <Card key={member.id}>
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-zinc-950 dark:text-zinc-50">
                    {member.user.fullName ?? member.user.email}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {member.user.title || "No title"} • {member.user.department || "No department"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="default">{member.role}</Badge>
                  {member.teamLinks.map((link) => (
                    <Badge key={link.id} variant="neutral">
                      {link.team.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent className="mt-4 space-y-4" value="invites">
          {invitations.map((invite) => (
            <Card key={invite.id}>
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-zinc-950 dark:text-zinc-50">{invite.email}</p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Expires {formatDate(invite.expiresAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="default">{invite.role}</Badge>
                  {invite.team ? <Badge variant="neutral">{invite.team.name}</Badge> : null}
                  <Badge variant={invite.status === "PENDING" ? "warning" : "neutral"}>{invite.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
