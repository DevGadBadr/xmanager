"use client";

import { useRouter } from "next/navigation";

import { DeleteTaskButton } from "@/components/forms/delete-task-button";
import { useAppNavigation } from "@/components/providers/app-navigation-provider";
import { TaskAssigneeGroup, type TaskAssigneeView } from "@/components/tasks/task-assignee-group";
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
  assignees: TaskAssigneeView[];
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
  const openTask = (taskId: string) => {
    const href = `/tasks/${taskId}?returnTo=${encodeURIComponent(returnTo)}`;

    startNavigation(href, "Opening task...");
    router.push(href, {
      scroll: false,
    });
  };

  return (
    <div
      aria-busy={isBusy}
      className={cn(
        "overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-opacity dark:border-zinc-800 dark:bg-zinc-900",
        isBusy && "pointer-events-none opacity-70",
      )}
    >
      <div className="space-y-3 p-3 md:hidden">
        {tasks.map((task) => (
          <div
            className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 transition hover:border-sky-200 hover:bg-sky-50/60 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-sky-500/30 dark:hover:bg-sky-500/10"
            key={task.id}
            onClick={() => openTask(task.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openTask(task.id);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{task.title}</p>
              </div>
              {canManageTasks ? (
                <div className="shrink-0" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                  <DeleteTaskButton taskId={task.id} taskTitle={task.title} />
                </div>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
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

              <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                <TaskAssigneeGroup
                  activeMembershipId={activeQuickFilter?.type === "assignee" ? activeQuickFilter.value : null}
                  assignees={task.assignees}
                  onAssigneeClick={onAssigneeClick}
                  triggerClassName={cn(
                    activeQuickFilter?.type === "assignee" &&
                      task.assignees.some((assignee) => assignee.membershipId === activeQuickFilter.value) &&
                      "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
                  )}
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <TaskMetaCard label="Start" value={formatDate(task.startDate)} />
              <TaskMetaCard label="End" value={formatDate(task.dueDate)} />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
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
                onClick={() => openTask(task.id)}
              >
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{task.title}</p>
                </td>
                <td className="px-4 py-3">
                  <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                    <TaskAssigneeGroup
                      activeMembershipId={activeQuickFilter?.type === "assignee" ? activeQuickFilter.value : null}
                      assignees={task.assignees}
                      onAssigneeClick={onAssigneeClick}
                      triggerClassName={cn(
                        activeQuickFilter?.type === "assignee" &&
                          task.assignees.some((assignee) => assignee.membershipId === activeQuickFilter.value) &&
                          "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
                      )}
                    />
                  </div>
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

function TaskMetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">{value}</p>
    </div>
  );
}
