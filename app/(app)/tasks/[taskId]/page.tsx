import { ArrowLeft } from "lucide-react";
import Image from "next/image";

import { CommentForm } from "@/components/forms/comment-form";
import { DeleteTaskButton } from "@/components/forms/delete-task-button";
import { EmptyState } from "@/components/shared/empty-state";
import { PendingLink } from "@/components/shared/pending-link";
import { TaskCommentActionsMenu } from "@/components/tasks/task-comment-actions-menu";
import { TaskContentEditor } from "@/components/tasks/task-content-editor";
import { TaskInlineEditor } from "@/components/tasks/task-inline-editor";
import { TaskUpdateBody } from "@/components/tasks/task-update-body";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ensureAppPath } from "@/lib/auth-path";
import { can } from "@/lib/rbac";
import { resolveAppAssetUrl } from "@/lib/utils";
import { requireCurrentMembership } from "@/modules/auth/server";
import { listWorkspaceMembershipOptions } from "@/modules/memberships/service";
import { getTaskDetails } from "@/modules/tasks/service";

export const dynamic = "force-dynamic";

export default async function TaskDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ taskId: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { taskId } = await params;
  const { returnTo } = await searchParams;
  const membership = await requireCurrentMembership();
  const canManageTasks = can(membership.role, "tasks:manage");
  const [task, memberships] = await Promise.all([
    getTaskDetails(taskId, membership.workspaceId),
    listWorkspaceMembershipOptions(membership.workspaceId),
  ]);

  if (!task) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <TaskBackLink
          ariaLabel={returnTo ? "Back to project" : "Back to projects"}
          busyMessage={returnTo ? "Loading project..." : "Loading projects..."}
          href={returnTo || "/projects"}
          label={returnTo ? "Project" : "Projects"}
        />
        <EmptyState
          description="This task may have been deleted or you may no longer have access to it."
          title="Task not found"
        />
      </div>
    );
  }

  const canEditContent = canManageTasks || task.creatorMembershipId === membership.id;
  const editableTask = {
    ...task,
    assignees: task.assignees.map((assignment) => ({
      membershipId: assignment.membershipId,
      user: assignment.membership.user,
    })),
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {returnTo ? (
        <TaskBackLink ariaLabel="Back to project" busyMessage="Loading project..." href={returnTo} label="Project" />
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <TaskContentEditor
                canEditContent={canEditContent}
                description={task.description}
                taskId={task.id}
                title={task.title}
              />
            </div>
            {canManageTasks ? (
              <DeleteTaskButton
                redirectTo={returnTo || `/projects/${task.projectId}`}
                taskId={task.id}
                taskTitle={task.title}
              />
            ) : null}
          </div>
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
          <TaskInlineEditor
            canManageTasks={canManageTasks}
            memberships={memberships}
            projectName={task.project.name}
            task={editableTask}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {task.comments.length > 0 ? (
              task.comments.map((comment) => (
                <div className="rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40" key={comment.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                        {comment.author.user.fullName ?? comment.author.user.email}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatTaskUpdateTimestamp(comment.createdAt, comment.updatedAt)}
                      </p>
                    </div>
                    {comment.authorMembershipId === membership.id ? (
                      <TaskCommentActionsMenu commentBody={comment.body} commentId={comment.id} />
                    ) : null}
                  </div>
                  <TaskUpdateBody body={comment.body} className="mt-3" />
                  {comment.attachments.some((attachment) => isImageAttachment(attachment)) ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {comment.attachments.filter(isImageAttachment).map((attachment) => (
                        <a
                          className="group overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 transition hover:border-sky-200 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-sky-500/30"
                          href={ensureAppPath(attachment.filePath)}
                          key={attachment.id}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <Image
                            alt={attachment.fileName}
                            className="h-52 w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                            height={720}
                            loading="lazy"
                            src={resolveAppAssetUrl(attachment.filePath) ?? ensureAppPath(attachment.filePath)}
                            unoptimized
                            width={1200}
                          />
                          <div className="border-t border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                            {attachment.fileName}
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : null}
                  {comment.attachments.some((attachment) => !isImageAttachment(attachment)) ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {comment.attachments.filter((attachment) => !isImageAttachment(attachment)).map((attachment) => (
                        <a
                          className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-sky-200 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-sky-500/30 dark:hover:text-sky-300"
                          href={ensureAppPath(attachment.filePath)}
                          key={attachment.id}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {attachment.fileName}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No updates yet.</p>
            )}
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">Post update</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Preserve spacing, paste URLs for clickable links, and upload images to show them inline in the update card.
              </p>
            </div>
            <CommentForm taskId={task.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function isImageAttachment(attachment: { fileName: string; mimeType: string | null }) {
  if (attachment.mimeType?.startsWith("image/")) {
    return true;
  }

  return /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(attachment.fileName);
}

function formatTaskUpdateTimestamp(createdAt: Date, updatedAt: Date) {
  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const createdLabel = formatter.format(createdAt);

  if (createdAt.getTime() === updatedAt.getTime()) {
    return createdLabel;
  }

  return `${createdLabel} · edited`;
}

function TaskBackLink({
  ariaLabel,
  busyMessage,
  href,
  label,
}: {
  ariaLabel: string;
  busyMessage: string;
  href: string;
  label: string;
}) {
  return (
    <div className="flex">
      <Button
        asChild
        className="h-8 rounded-full border border-zinc-200 bg-white px-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600 shadow-sm hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-sky-500/30 dark:hover:bg-sky-500/10 dark:hover:text-sky-300"
        size="sm"
        variant="ghost"
      >
        <PendingLink aria-label={ariaLabel} busyMessage={busyMessage} href={href}>
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{label}</span>
        </PendingLink>
      </Button>
    </div>
  );
}
