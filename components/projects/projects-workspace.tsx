import { DeleteProjectButton } from "@/components/forms/delete-project-button";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectWorkspaceView } from "@/components/projects/project-workspace-view";
import { EmptyState } from "@/components/shared/empty-state";
import { PendingLink } from "@/components/shared/pending-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { can } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { requireCurrentMembership } from "@/modules/auth/server";
import { listWorkspaceMembershipOptions } from "@/modules/memberships/service";
import { getProjectWorkspace, listProjectExplorer } from "@/modules/projects/service";

export async function ProjectsWorkspace({
  workspaceId,
  selectedProjectId,
}: {
  workspaceId: string;
  selectedProjectId?: string;
}) {
  const membership = await requireCurrentMembership();
  const explorer = await listProjectExplorer(workspaceId);
  const [memberships, projectWorkspace] = await Promise.all([
    listWorkspaceMembershipOptions(workspaceId),
    selectedProjectId ? getProjectWorkspace(selectedProjectId, workspaceId) : Promise.resolve(null),
  ]);
  const canManageTasks = can(membership.role, "tasks:manage");
  const canEditProjectContent = projectWorkspace
    ? projectWorkspace.ownerMembershipId === membership.id || membership.role === "OWNER" || membership.role === "ADMIN"
    : false;
  const filterAssignees = projectWorkspace
    ? projectWorkspace.members.map((member) => ({
        id: member.membership.id,
        label: member.membership.user.fullName ?? member.membership.user.email,
      }))
    : memberships.map((membership) => ({
        id: membership.id,
        label: membership.user.fullName ?? membership.user.email,
      }));

  return (
    <div className={cn("space-y-3", projectWorkspace && "flex min-h-0 flex-col space-y-0 xl:min-h-[calc(100dvh-6rem)]")}>
      <section className={cn("min-w-0 space-y-3", projectWorkspace && "flex min-h-0 flex-1 flex-col space-y-0")}>
        {projectWorkspace ? (
          <>
            <ProjectWorkspaceView
              assignees={filterAssignees}
              canEditProjectContent={canEditProjectContent}
              canManageTasks={canManageTasks}
              key={projectWorkspace.id}
              memberships={memberships}
              ownerLabel={projectWorkspace.owner.user.fullName ?? projectWorkspace.owner.user.email}
              projectDescription={projectWorkspace.description}
              projectName={projectWorkspace.name}
              projects={explorer.projects}
              selectedProjectId={projectWorkspace.id}
              tasks={projectWorkspace.tasks}
            />
          </>
        ) : explorer.projects.length === 0 ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-2xl">
                  Choose a project
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Select a project from the sidebar or create a new one to start managing work.
                </p>
              </div>
              <CreateProjectDialog />
            </div>
            <EmptyState
              description="No projects yet. Create one to start organizing tasks and team ownership."
              title="No projects available"
            />
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-2xl">
                  Choose a project
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Select a project from the sidebar to open its tasks and filters.
                </p>
              </div>
              <CreateProjectDialog />
            </div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle>Projects</CardTitle>
                <Badge variant="neutral">{explorer.projects.length}</Badge>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {explorer.projects.map((project) => (
                  <div className="flex items-center gap-2" key={project.id}>
                    <PendingLink
                      busyMessage="Loading project..."
                      className="flex flex-1 items-center justify-between gap-3 rounded-xl border border-zinc-200 px-3.5 py-3 transition hover:border-sky-200 hover:bg-sky-50/60 dark:border-zinc-800 dark:hover:border-sky-500/30 dark:hover:bg-sky-500/10"
                      href={`/projects/${project.id}`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">{project.name}</p>
                          {project.key ? <Badge variant="neutral">{project.key}</Badge> : null}
                          {project.status ? <Badge variant="default">{project.status}</Badge> : null}
                        </div>
                        {project.description ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                            {project.description}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {project.openTaskCount ?? project.taskCount ?? 0} open tasks
                        </p>
                      </div>
                      <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Open</span>
                    </PendingLink>
                    {project.ownerMembershipId === membership.id || membership.role === "OWNER" || membership.role === "ADMIN" ? (
                      <DeleteProjectButton projectId={project.id} projectName={project.name} />
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </section>
    </div>
  );
}
