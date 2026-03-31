import { CommentForm } from "@/components/forms/comment-form";
import { TaskUpdateForm } from "@/components/forms/task-update-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { requireCurrentMembership } from "@/modules/auth/server";
import { listWorkspaceMembershipOptions } from "@/modules/memberships/service";
import { getTaskDetails } from "@/modules/tasks/service";

export const dynamic = "force-dynamic";

export default async function TaskDetailsPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const membership = await requireCurrentMembership();
  const [task, memberships] = await Promise.all([
    getTaskDetails(taskId, membership.workspaceId),
    listWorkspaceMembershipOptions(membership.workspaceId),
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{task.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">{task.status}</Badge>
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
            <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              {task.description || "No description has been added yet."}
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Project</p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{task.project.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Assignee</p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {task.assignee?.user.fullName ?? task.assignee?.user.email ?? "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Due date</p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{formatDate(task.dueDate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CommentForm taskId={task.id} />
            <div className="space-y-3">
              {task.comments.map((comment) => (
                <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800" key={comment.id}>
                  <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {comment.author.user.fullName ?? comment.author.user.email}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{comment.body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <TaskUpdateForm memberships={memberships} task={task} />
    </div>
  );
}
