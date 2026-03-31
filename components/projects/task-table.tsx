"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatDate } from "@/lib/utils";

type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  startDate: Date | string | null;
  dueDate: Date | string | null;
  assignee?: {
    user: {
      fullName: string | null;
      email: string;
    };
  } | null;
};

export function ProjectTaskTable({
  tasks,
  selectedTaskId,
}: {
  tasks: TaskRow[];
  selectedTaskId?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/80 text-left text-xs uppercase tracking-[0.18em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-400">
              <th className="px-5 py-4 font-semibold">Task</th>
              <th className="px-5 py-4 font-semibold">Assignee</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Priority</th>
              <th className="px-5 py-4 font-semibold">Start</th>
              <th className="px-5 py-4 font-semibold">End</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                className={cn(
                  "cursor-pointer border-b border-zinc-100 transition hover:bg-sky-50/60 dark:border-zinc-800 dark:hover:bg-sky-500/8",
                  selectedTaskId === task.id && "bg-sky-50 dark:bg-sky-500/10",
                )}
                key={task.id}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("task", task.id);
                  router.replace(`${pathname}?${params.toString()}`, {
                    scroll: false,
                  });
                }}
              >
                <td className="px-5 py-4">
                  <div className="space-y-1">
                    <p className="font-medium text-zinc-950 dark:text-zinc-50">{task.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Click to open task panel</p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getInitials(task.assignee?.user.fullName ?? task.assignee?.user.email)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">
                      {task.assignee?.user.fullName ?? task.assignee?.user.email ?? "Unassigned"}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Badge variant="neutral">{formatTaskStatus(task.status)}</Badge>
                </td>
                <td className="px-5 py-4">
                  <Badge variant={getPriorityVariant(task.priority)}>{task.priority}</Badge>
                </td>
                <td className="px-5 py-4 text-sm text-zinc-600 dark:text-zinc-300">{formatDate(task.startDate)}</td>
                <td className="px-5 py-4 text-sm text-zinc-600 dark:text-zinc-300">{formatDate(task.dueDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getPriorityVariant(priority: string) {
  if (priority === "URGENT") {
    return "danger";
  }

  if (priority === "HIGH") {
    return "warning";
  }

  if (priority === "LOW") {
    return "success";
  }

  return "neutral";
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
