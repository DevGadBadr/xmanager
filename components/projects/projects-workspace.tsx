import type { ComponentType } from "react";
import { FolderKanban, Layers3, ListFilter, Users } from "lucide-react";

import { CommentForm } from "@/components/forms/comment-form";
import { FolderForm } from "@/components/forms/folder-form";
import { ProjectForm } from "@/components/forms/project-form";
import { TaskForm } from "@/components/forms/task-form";
import { TaskUpdateForm } from "@/components/forms/task-update-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { listWorkspaceMembershipOptions } from "@/modules/memberships/service";
import { getProjectWorkspace, listProjectExplorer } from "@/modules/projects/service";
import { getTaskDetails } from "@/modules/tasks/service";
import { ExplorerTree } from "@/components/workspace/explorer-tree";
import { WorkspaceFilterBar } from "@/components/workspace/filter-bar";
import { ProjectTaskTable } from "@/components/projects/task-table";

export async function ProjectsWorkspace({
  workspaceId,
  selectedProjectId,
  selectedFolderId,
  selectedTaskId,
  assigneeMembershipId,
  search,
}: {
  workspaceId: string;
  selectedProjectId?: string;
  selectedFolderId?: string;
  selectedTaskId?: string;
  assigneeMembershipId?: string;
  search?: string;
}) {
  const explorer = await listProjectExplorer(workspaceId);
  const [memberships, projectWorkspace, selectedTask] = await Promise.all([
    listWorkspaceMembershipOptions(workspaceId),
    selectedProjectId
      ? getProjectWorkspace(selectedProjectId, workspaceId, {
          assigneeMembershipId,
          search,
        })
      : Promise.resolve(null),
    selectedTaskId ? getTaskDetails(selectedTaskId, workspaceId).catch(() => null) : Promise.resolve(null),
  ]);

  const selectedFolder =
    explorer.folders.find((folder) => folder.id === selectedFolderId) ??
    (projectWorkspace?.folder ? explorer.folders.find((folder) => folder.id === projectWorkspace.folder?.id) : null) ??
    null;
  const folderOptions = buildFolderOptions(explorer.folders);
  const folderProjectCount = selectedFolder
    ? explorer.projects.filter((project) => project.folderId === selectedFolder.id).length
    : 0;
  const panelTask =
    selectedTask && projectWorkspace && selectedTask.projectId === projectWorkspace.id ? selectedTask : null;
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
    <div className="grid gap-6 xl:grid-cols-[310px_minmax(0,1fr)_360px]">
      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <Card className="border-zinc-200/80 bg-white/95 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/95">
          <CardContent className="space-y-5 p-5">
            <ExplorerTree
              assets={explorer.projects}
              basePath="/projects"
              folders={explorer.folders}
              key={`${selectedFolder?.id ?? "root"}:${projectWorkspace?.id ?? "none"}`}
              selectedAssetId={projectWorkspace?.id}
              selectedFolderId={selectedFolder?.id}
              title="Project folders"
            />
            <Separator />
            <FolderForm
              className="border-dashed shadow-none"
              defaultParentFolderId={selectedFolder?.id ?? ""}
              folderOptions={folderOptions}
              title="New folder"
            />
            <ProjectForm
              className="border-dashed shadow-none"
              defaultFolderId={selectedFolder?.id ?? ""}
              folderOptions={folderOptions}
              title="New project"
            />
          </CardContent>
        </Card>
      </aside>

      <section className="min-w-0 space-y-5">
        {projectWorkspace ? (
          <>
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default">{projectWorkspace.status}</Badge>
                    {projectWorkspace.folder ? <Badge variant="neutral">{projectWorkspace.folder.name}</Badge> : null}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">
                      {projectWorkspace.key}
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                      {projectWorkspace.name}
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                      {projectWorkspace.description || "No description has been added to this project yet."}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <MetricCard icon={FolderKanban} label="Owner" value={projectWorkspace.owner.user.fullName ?? projectWorkspace.owner.user.email} />
                  <MetricCard icon={Layers3} label="Members" value={String(projectWorkspace.members.length)} />
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-4">
                <MetricChip label="Open tasks" value={String(projectWorkspace.tasks.filter((task) => task.status !== "DONE" && task.status !== "CANCELLED").length)} />
                <MetricChip label="Total tasks" value={String(projectWorkspace.tasks.length)} />
                <MetricChip label="Start date" value={findProjectStartDate(projectWorkspace.tasks)} />
                <MetricChip label="End date" value={findProjectEndDate(projectWorkspace.tasks, projectWorkspace.dueDate)} />
              </div>
            </div>

            <WorkspaceFilterBar
              assignees={filterAssignees}
              initialAssigneeId={assigneeMembershipId}
              initialSearch={search}
              key={`${projectWorkspace.id}:${assigneeMembershipId ?? "all"}:${search ?? ""}`}
            />

            {projectWorkspace.tasks.length > 0 ? (
              <ProjectTaskTable selectedTaskId={panelTask?.id} tasks={projectWorkspace.tasks} />
            ) : (
              <EmptyState
                description="No tasks match the current filters. Try another assignee or search term, or create a new task."
                title="No visible tasks"
              />
            )}
          </>
        ) : selectedFolder ? (
          <Card>
            <CardHeader>
              <CardTitle>{selectedFolder.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                This folder is ready for multiple projects. Create nested folders for programs or clients, then
                place projects beneath them to keep the workspace consistent.
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <MetricChip label="Direct projects" value={String(folderProjectCount)} />
                <MetricChip
                  label="Sub-folders"
                  value={String(explorer.folders.filter((folder) => folder.parentFolderId === selectedFolder.id).length)}
                />
                <MetricChip label="Scope" value="Projects" />
              </div>
            </CardContent>
          </Card>
        ) : explorer.projects.length === 0 && explorer.folders.length === 0 ? (
          <EmptyState
            description="Create a folder or project from the left explorer to start structuring work in a Wrike-style hierarchy."
            title="No project structure yet"
          />
        ) : (
          <EmptyState
            description="Select a folder or project from the explorer. Projects open in a task control view with filters and task details."
            title="Choose a project"
          />
        )}
      </section>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        {projectWorkspace ? (
          panelTask ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Task details</p>
                      <CardTitle className="mt-2 text-xl">{panelTask.title}</CardTitle>
                    </div>
                    <Badge variant="neutral">{panelTask.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                    {panelTask.description || "No task description has been added yet."}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <PanelMeta label="Assignee" value={panelTask.assignee?.user.fullName ?? panelTask.assignee?.user.email ?? "Unassigned"} />
                    <PanelMeta label="Reporter" value={panelTask.reporter?.user.fullName ?? panelTask.reporter?.user.email ?? "Not set"} />
                    <PanelMeta label="Start date" value={formatDate(panelTask.startDate)} />
                    <PanelMeta label="End date" value={formatDate(panelTask.dueDate)} />
                  </div>
                </CardContent>
              </Card>

              <TaskUpdateForm memberships={memberships} task={panelTask} title="Task controls" />

              <Card>
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CommentForm taskId={panelTask.id} />
                  <div className="space-y-3">
                    {panelTask.comments.length > 0 ? (
                      panelTask.comments.map((comment) => (
                        <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800" key={comment.id}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                              {comment.author.user.fullName ?? comment.author.user.email}
                            </p>
                            <p className="text-xs text-zinc-400">{formatDate(comment.createdAt)}</p>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{comment.body}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        No comments yet. Add context or handoff notes here.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <TaskForm memberships={memberships} projectId={projectWorkspace.id} title="New task" />
              <Card>
                <CardHeader>
                  <CardTitle>Project team</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {projectWorkspace.members.map((member) => (
                    <div
                      className="flex items-center justify-between rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
                      key={member.id}
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                          {member.membership.user.fullName ?? member.membership.user.email}
                        </p>
                        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                          {member.membership.role}
                        </p>
                      </div>
                      <Badge variant="neutral">
                        {projectWorkspace.tasks.filter((task) => task.assignee?.id === member.membership.id).length} tasks
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Reusable pattern</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              <p>This workspace now follows a repeatable structure: explorer tree, filtered control table, and contextual detail panel.</p>
              <div className="space-y-3">
                <InlineNote icon={FolderKanban} label="Explorer" text="Nested folders and projects in a persistent hierarchy." />
                <InlineNote icon={ListFilter} label="Table" text="Search and assignee filtering on the core work list." />
                <InlineNote icon={Users} label="Panel" text="Contextual create/edit surfaces without leaving the workspace." />
              </div>
            </CardContent>
          </Card>
        )}
      </aside>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/60">
      <div className="rounded-xl bg-sky-100 p-2 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">{label}</p>
        <p className="mt-1 text-sm font-medium text-zinc-950 dark:text-zinc-50">{value}</p>
      </div>
    </div>
  );
}

function MetricChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/60">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">{value}</p>
    </div>
  );
}

function PanelMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/60">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">{value}</p>
    </div>
  );
}

function InlineNote({
  icon: Icon,
  label,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <div className="rounded-xl bg-sky-100 p-2 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{label}</p>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{text}</p>
      </div>
    </div>
  );
}

function buildFolderOptions(
  folders: Array<{ id: string; name: string; parentFolderId: string | null }>,
  parentFolderId: string | null = null,
  depth = 0,
): Array<{ id: string; name: string; depth: number }> {
  const branch = folders
    .filter((folder) => folder.parentFolderId === parentFolderId)
    .sort((left, right) => left.name.localeCompare(right.name));

  return branch.flatMap((folder) => [
    { id: folder.id, name: folder.name, depth },
    ...buildFolderOptions(folders, folder.id, depth + 1),
  ]);
}

function findProjectStartDate(tasks: Array<{ startDate: Date | null }>) {
  const sorted = tasks.filter((task) => task.startDate).sort((left, right) => {
    return new Date(left.startDate ?? 0).getTime() - new Date(right.startDate ?? 0).getTime();
  });

  return formatDate(sorted[0]?.startDate);
}

function findProjectEndDate(tasks: Array<{ dueDate: Date | null }>, projectDueDate: Date | null) {
  const sorted = tasks.filter((task) => task.dueDate).sort((left, right) => {
    return new Date(right.dueDate ?? 0).getTime() - new Date(left.dueDate ?? 0).getTime();
  });

  return formatDate(sorted[0]?.dueDate ?? projectDueDate);
}
