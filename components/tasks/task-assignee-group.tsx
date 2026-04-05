"use client";

import { Check } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type TaskAssigneeView = {
  membershipId: string;
  user: {
    fullName: string | null;
    email: string;
  };
};

export function TaskAssigneeSummary({
  assignees,
  avatarClassName,
  className,
  emptyLabel = "Unassigned",
  maxVisible = 3,
  showLabel = true,
  textClassName,
}: {
  assignees: TaskAssigneeView[];
  avatarClassName?: string;
  className?: string;
  emptyLabel?: string;
  maxVisible?: number;
  showLabel?: boolean;
  textClassName?: string;
}) {
  if (assignees.length === 0) {
    return <span className={cn("text-sm text-zinc-500 dark:text-zinc-400", textClassName)}>{emptyLabel}</span>;
  }

  const visibleAssignees = assignees.slice(0, maxVisible);
  const hiddenCount = assignees.length - visibleAssignees.length;
  const primaryLabel = getTaskAssigneeLabel(assignees[0]);
  const summaryLabel = assignees.length === 1 ? primaryLabel : `${primaryLabel} +${assignees.length - 1}`;

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <div className="flex items-center -space-x-2">
        {visibleAssignees.map((assignee) => (
          <Avatar className={cn("h-7 w-7 ring-2 ring-white dark:ring-zinc-900", avatarClassName)} key={assignee.membershipId}>
            <AvatarFallback>{getTaskAssigneeInitials(getTaskAssigneeLabel(assignee))}</AvatarFallback>
          </Avatar>
        ))}
        {hiddenCount > 0 ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-[11px] font-semibold text-zinc-600 ring-2 ring-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-900">
            +{hiddenCount}
          </span>
        ) : null}
      </div>
      {showLabel ? (
        <span className={cn("truncate text-sm font-medium text-zinc-700 dark:text-zinc-200", textClassName)}>
          {summaryLabel}
        </span>
      ) : null}
    </div>
  );
}

export function TaskAssigneeGroup({
  activeMembershipId,
  assignees,
  emptyLabel = "Unassigned",
  onAssigneeClick,
  showLabel = true,
  triggerClassName,
}: {
  activeMembershipId?: string | null;
  assignees: TaskAssigneeView[];
  emptyLabel?: string;
  onAssigneeClick?: (membershipId: string) => void;
  showLabel?: boolean;
  triggerClassName?: string;
}) {
  if (assignees.length === 0) {
    return <span className="text-sm text-zinc-500 dark:text-zinc-400">{emptyLabel}</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex min-w-0 items-center rounded-full border border-transparent px-1.5 py-1 text-left transition hover:bg-zinc-100 dark:hover:bg-zinc-800/80",
            triggerClassName,
          )}
          type="button"
        >
          <TaskAssigneeSummary assignees={assignees} showLabel={showLabel} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-1.5">
        <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          {assignees.length} assignee{assignees.length === 1 ? "" : "s"}
        </div>
        <div className="mt-1 space-y-1">
          {assignees.map((assignee) => {
            const isActive = activeMembershipId === assignee.membershipId;
            const label = getTaskAssigneeLabel(assignee);
            return (
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-zinc-100 dark:hover:bg-zinc-800",
                  isActive && "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
                )}
                key={assignee.membershipId}
                onClick={() => onAssigneeClick?.(assignee.membershipId)}
                type="button"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getTaskAssigneeInitials(label)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
                  {assignee.user.fullName ? (
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{assignee.user.email}</p>
                  ) : null}
                </div>
                {isActive ? <Check className="h-4 w-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getTaskAssigneeLabel(assignee: TaskAssigneeView) {
  return assignee.user.fullName ?? assignee.user.email;
}

export function getTaskAssigneeInitials(value: string) {
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
