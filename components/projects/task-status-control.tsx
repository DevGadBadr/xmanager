"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { initialActionState } from "@/lib/action-state";
import { TASK_STATUS_OPTIONS, formatTaskStatus, normalizeTaskStatus, type TaskStatusValue } from "@/lib/task-status";
import { cn } from "@/lib/utils";
import { updateTaskAction } from "@/modules/tasks/actions";
import { type TaskAssigneeView } from "@/components/tasks/task-assignee-group";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type StatusControlTask = {
  id: string;
  status: string;
  priority: string;
  startDate: Date | string | null;
  dueDate: Date | string | null;
  assignees: TaskAssigneeView[];
};

function formatDateInputValue(value: Date | string | null) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function ProjectTaskStatusControl({
  canManageTasks,
  task,
}: {
  canManageTasks: boolean;
  task: StatusControlTask;
}) {
  const initialStatus = normalizeTaskStatus(task.status) ?? "OPEN";
  const [currentStatus, setCurrentStatus] = useState<TaskStatusValue>(initialStatus);
  const [pending, startTransition] = useTransition();

  if (!canManageTasks) {
    return <Badge variant="neutral">{formatTaskStatus(currentStatus)}</Badge>;
  }

  const submitStatus = (nextStatus: TaskStatusValue) => {
    if (nextStatus === currentStatus || pending) {
      return;
    }

    const previousStatus = currentStatus;
    setCurrentStatus(nextStatus);

    const payload = new FormData();
    payload.set("taskId", task.id);
    payload.set("status", nextStatus);
    payload.set("priority", task.priority);
    for (const assignee of task.assignees) {
      payload.append("assigneeMembershipIds", assignee.membershipId);
    }
    payload.set("startDate", formatDateInputValue(task.startDate));
    payload.set("dueDate", formatDateInputValue(task.dueDate));

    startTransition(async () => {
      const state = await updateTaskAction(initialActionState, payload);

      if (state.status === "success") {
        toast.success(state.message ?? "Task updated.");
        return;
      }

      setCurrentStatus(previousStatus);
      toast.error(state.message ?? "Unable to update task.");
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Change task status"
          className="appearance-none rounded-full border-0"
          disabled={pending}
          type="button"
        >
          <Badge
            className={cn(
              "transition",
              pending
                ? "opacity-70"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
            )}
            variant="neutral"
          >
            {formatTaskStatus(currentStatus)}
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 p-1.5">
        {TASK_STATUS_OPTIONS.map((option) => {
          const selected = currentStatus === option.value;

          return (
            <DropdownMenuItem
              className={cn(
                "flex items-center justify-between rounded-lg px-2.5 py-2",
                selected && "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
              )}
              key={option.value}
              onSelect={() => submitStatus(option.value)}
            >
              <span>{option.label}</span>
              {selected ? <Check className="h-4 w-4 shrink-0" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
