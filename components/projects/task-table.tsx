"use client";

import { useRouter } from "next/navigation";

import { DeleteTaskButton } from "@/components/forms/delete-task-button";
import { useAppNavigation } from "@/components/providers/app-navigation-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";

type QuickFilter =
  | {
      type: "assignee";
      value: string;
    }
  | {
      type: "status";
      value: string;
    }
  | null;

type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  startDate: Date | string | null;
  dueDate: Date | string | null;
  assigneeMembershipId: string | null;
  assignee?: {
    user: {
      fullName: string | null;
      email: string;
    };
  } | null;
};

export function ProjectTaskTable({
  activeQuickFilter,
  canManageTasks,
  onAssigneeClick,
  onStatusClick,
  tasks,
  returnTo,
}: {
  activeQuickFilter: QuickFilter;
  canManageTasks: boolean;
  onAssigneeClick: (membershipId: string) => void;
  onStatusClick: (status: string) => void;
  tasks: TaskRow[];
  returnTo: string;
}) {
  const router = useRouter();
  const { isBusy, startNavigation } = useAppNavigation();

  return (
    <div
      aria-busy={isBusy}
      className={cn(
        "overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-opacity dark:border-zinc-800 dark:bg-zinc-900",
        isBusy && "pointer-events-none opacity-70",
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/80 text-left text-[11px] uppercase tracking-[0.16em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-400">
              <th className="px-4 py-3 font-semibold">Task</th>
              <th className="px-4 py-3 font-semibold">Assignee</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Start</th>
              <th className="px-4 py-3 font-semibold">End</th>
              {canManageTasks ? <th className="px-4 py-3 text-right font-semibold">Delete</th> : null}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                className="cursor-pointer border-b border-zinc-100 transition hover:bg-sky-50/60 dark:border-zinc-800 dark:hover:bg-sky-500/8"
                key={task.id}
                onClick={() => {
                  const href = `/tasks/${task.id}?returnTo=${encodeURIComponent(returnTo)}`;

                  startNavigation(href, "Opening task...");
                  router.push(href, {
                    scroll: false,
                  });
                }}
              >
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{task.title}</p>
                </td>
                <td className="px-4 py-3">
                  <button
                    aria-pressed={activeQuickFilter?.type === "assignee" && activeQuickFilter.value === task.assigneeMembershipId}
                    className={cn(
                      "appearance-none border-0 flex items-center gap-2.5 rounded-full px-1.5 py-1 text-left transition hover:bg-zinc-100 dark:hover:bg-zinc-800/80",
                      activeQuickFilter?.type === "assignee" &&
                        activeQuickFilter.value === task.assigneeMembershipId &&
                        "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
                      !task.assigneeMembershipId && "cursor-default hover:bg-transparent dark:hover:bg-transparent",
                    )}
                    disabled={!task.assigneeMembershipId}
                    onClick={(event) => {
                      event.stopPropagation();

                      if (!task.assigneeMembershipId) {
                        return;
                      }

                      onAssigneeClick(task.assigneeMembershipId);
                    }}
                    type="button"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback>{getInitials(task.assignee?.user.fullName ?? task.assignee?.user.email)}</AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "text-sm",
                        activeQuickFilter?.type === "assignee" && activeQuickFilter.value === task.assigneeMembershipId
                          ? "text-current"
                          : "text-zinc-600 dark:text-zinc-300",
                      )}
                    >
                      {task.assignee?.user.fullName ?? task.assignee?.user.email ?? "Unassigned"}
                    </span>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    aria-pressed={activeQuickFilter?.type === "status" && activeQuickFilter.value === task.status}
                    className="appearance-none rounded-full border-0"
                    onClick={(event) => {
                      event.stopPropagation();
                      onStatusClick(task.status);
                    }}
                    type="button"
                  >
                    <Badge
                      className={cn(
                        "transition",
                        activeQuickFilter?.type === "status" && activeQuickFilter.value === task.status
                          ? ""
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
                      )}
                      variant={activeQuickFilter?.type === "status" && activeQuickFilter.value === task.status ? "default" : "neutral"}
                    >
                      {formatTaskStatus(task.status)}
                    </Badge>
                  </button>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{formatDate(task.startDate)}</td>
                <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{formatDate(task.dueDate)}</td>
                {canManageTasks ? (
                  <td className="px-4 py-3 text-right">
                    <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                      <DeleteTaskButton taskId={task.id} taskTitle={task.title} />
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatTaskStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getInitials(value?: string | null) {
  if (!value) {
    return "NA";
  }

  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
