"use client";

import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronDown, CirclePlus, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { initialActionState } from "@/lib/action-state";
import { formatDate } from "@/lib/utils";
import { updateTaskAction } from "@/modules/tasks/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EditableTask = {
  id: string;
  status: string;
  priority: string;
  assigneeMembershipId: string | null;
  assignee?: {
    user: {
      fullName: string | null;
      email: string;
    };
  } | null;
  startDate?: Date | string | null;
  dueDate?: Date | string | null;
};

type MembershipOption = {
  id: string;
  user: {
    fullName: string | null;
    email: string;
  };
};

type ActiveEditor = "assignee" | "dueDate" | "priority" | "startDate" | "status" | null;

type FloatingPosition = {
  left: number;
  top: number;
  width: number;
};

const STATUS_OPTIONS = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "DONE", label: "Done" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
] as const;

export function TaskInlineEditor({
  canManageTasks,
  memberships,
  projectName,
  task,
}: {
  canManageTasks: boolean;
  memberships: MembershipOption[];
  projectName: string;
  task: EditableTask;
}) {
  const [state, formAction, pending] = useActionState(updateTaskAction, initialActionState);
  const [activeEditor, setActiveEditor] = useState<ActiveEditor>(null);
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState<FloatingPosition | null>(null);
  const [draftStartDate, setDraftStartDate] = useState(formatDateInput(task.startDate));
  const [draftDueDate, setDraftDueDate] = useState(formatDateInput(task.dueDate));
  const panelRef = useRef<HTMLDivElement | null>(null);
  const currentAssignee = useMemo(
    () => memberships.find((membership) => membership.id === task.assigneeMembershipId) ?? null,
    [memberships, task.assigneeMembershipId],
  );

  const closeEditor = () => {
    setActiveEditor(null);
    setAnchorElement(null);
    setPosition(null);
  };

  useEffect(() => {
    if (state.status === "success" && state.message) {
      toast.success(state.message);
    }

    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  useEffect(() => {
    if (!activeEditor || !anchorElement) {
      return;
    }

    const updatePosition = () => {
      setPosition(getFloatingPosition(anchorElement.getBoundingClientRect(), activeEditor));
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (panelRef.current?.contains(target) || anchorElement.contains(target)) {
        return;
      }

      closeEditor();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeEditor();
      }
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeEditor, anchorElement]);

  const submitUpdate = (
    overrides: Partial<Record<"assigneeMembershipId" | "dueDate" | "priority" | "startDate" | "status", string>>,
  ) => {
    const payload = new FormData();
    payload.set("taskId", task.id);
    payload.set("status", overrides.status ?? task.status);
    payload.set("priority", overrides.priority ?? task.priority);
    payload.set("assigneeMembershipId", overrides.assigneeMembershipId ?? task.assigneeMembershipId ?? "");
    payload.set("startDate", overrides.startDate ?? formatDateInput(task.startDate));
    payload.set("dueDate", overrides.dueDate ?? formatDateInput(task.dueDate));

    startTransition(() => formAction(payload));
  };

  const submitAndClose = (
    overrides: Partial<Record<"assigneeMembershipId" | "dueDate" | "priority" | "startDate" | "status", string>>,
  ) => {
    closeEditor();
    submitUpdate(overrides);
  };

  const openEditor = (editor: Exclude<ActiveEditor, null>, target: HTMLElement) => {
    if (editor === "startDate") {
      setDraftStartDate(formatDateInput(task.startDate));
    }

    if (editor === "dueDate") {
      setDraftDueDate(formatDateInput(task.dueDate));
    }

    const nextPosition = getFloatingPosition(target.getBoundingClientRect(), editor);

    if (activeEditor === editor && anchorElement === target) {
      closeEditor();
      return;
    }

    setAnchorElement(target);
    setPosition(nextPosition);
    setActiveEditor(editor);
  };

  return (
    <>
      <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/40 md:grid-cols-2 xl:grid-cols-4">
        <TaskField
          label="Status"
          trigger={
            canManageTasks ? (
              <InlineTrigger
                onClick={(event) => openEditor("status", event.currentTarget)}
                open={activeEditor === "status"}
              >
                <StatusBadge status={task.status} />
              </InlineTrigger>
            ) : (
              <StatusBadge status={task.status} />
            )
          }
        />

        <TaskField
          label="Priority"
          trigger={
            canManageTasks ? (
              <InlineTrigger
                onClick={(event) => openEditor("priority", event.currentTarget)}
                open={activeEditor === "priority"}
              >
                <PriorityBadge priority={task.priority} />
              </InlineTrigger>
            ) : (
              <PriorityBadge priority={task.priority} />
            )
          }
        />

        <TaskField
          label="Start date"
          trigger={
            canManageTasks ? (
              <InlineTrigger
                onClick={(event) => openEditor("startDate", event.currentTarget)}
                open={activeEditor === "startDate"}
              >
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                {formatDate(task.startDate)}
              </InlineTrigger>
            ) : (
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatDate(task.startDate)}</span>
            )
          }
        />

        <TaskField
          label="Due date"
          trigger={
            canManageTasks ? (
              <InlineTrigger
                onClick={(event) => openEditor("dueDate", event.currentTarget)}
                open={activeEditor === "dueDate"}
              >
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                {formatDate(task.dueDate)}
              </InlineTrigger>
            ) : (
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatDate(task.dueDate)}</span>
            )
          }
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <TaskMetaItem label="Project">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{projectName}</p>
        </TaskMetaItem>

        <TaskMetaItem label="Assignee">
          <div className="flex flex-wrap items-center gap-2">
            {canManageTasks ? (
              <>
                <InlineTrigger
                  onClick={(event) => openEditor("assignee", event.currentTarget)}
                  open={activeEditor === "assignee"}
                >
                  {currentAssignee ? (
                    <>
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>
                          {getInitials(currentAssignee.user.fullName ?? currentAssignee.user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{currentAssignee.user.fullName ?? currentAssignee.user.email}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Unassigned</span>
                    </>
                  )}
                </InlineTrigger>
                <Button
                  aria-label="Assign task"
                  onClick={(event) => openEditor("assignee", event.currentTarget)}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <CirclePlus className="h-4 w-4" />
                </Button>
              </>
            ) : currentAssignee ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>{getInitials(currentAssignee.user.fullName ?? currentAssignee.user.email)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {currentAssignee.user.fullName ?? currentAssignee.user.email}
                </span>
              </div>
            ) : (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Unassigned</span>
            )}
          </div>
        </TaskMetaItem>
      </div>

      <FloatingEditorShell panelRef={panelRef} position={position}>
        {activeEditor === "status" ? (
          <FloatingOptionList>
            {STATUS_OPTIONS.map((option) => (
              <FloatingOptionButton
                key={option.value}
                onClick={() => submitAndClose({ status: option.value })}
                pending={pending}
                selected={task.status === option.value}
              >
                <StatusBadge status={option.value} />
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{option.label}</span>
              </FloatingOptionButton>
            ))}
          </FloatingOptionList>
        ) : null}

        {activeEditor === "priority" ? (
          <FloatingOptionList>
            {PRIORITY_OPTIONS.map((option) => (
              <FloatingOptionButton
                key={option.value}
                onClick={() => submitAndClose({ priority: option.value })}
                pending={pending}
                selected={task.priority === option.value}
              >
                <PriorityBadge priority={option.value} />
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{option.label}</span>
              </FloatingOptionButton>
            ))}
          </FloatingOptionList>
        ) : null}

        {activeEditor === "assignee" ? (
          <FloatingOptionList className="max-h-80 overflow-y-auto">
            <FloatingOptionButton
              onClick={() => submitAndClose({ assigneeMembershipId: "" })}
              pending={pending}
              selected={!task.assigneeMembershipId}
            >
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Unassigned</span>
            </FloatingOptionButton>
            {memberships.map((membership) => (
              <FloatingOptionButton
                key={membership.id}
                onClick={() => submitAndClose({ assigneeMembershipId: membership.id })}
                pending={pending}
                selected={task.assigneeMembershipId === membership.id}
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>{getInitials(membership.user.fullName ?? membership.user.email)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {membership.user.fullName ?? membership.user.email}
                  </span>
                </div>
              </FloatingOptionButton>
            ))}
          </FloatingOptionList>
        ) : null}

        {activeEditor === "startDate" ? (
          <FloatingDateEditor
            onCancel={() => {
              setDraftStartDate(formatDateInput(task.startDate));
              closeEditor();
            }}
            onChange={setDraftStartDate}
            onSave={() => submitAndClose({ startDate: draftStartDate })}
            pending={pending}
            value={draftStartDate}
          />
        ) : null}

        {activeEditor === "dueDate" ? (
          <FloatingDateEditor
            onCancel={() => {
              setDraftDueDate(formatDateInput(task.dueDate));
              closeEditor();
            }}
            onChange={setDraftDueDate}
            onSave={() => submitAndClose({ dueDate: draftDueDate })}
            pending={pending}
            value={draftDueDate}
          />
        ) : null}
      </FloatingEditorShell>
    </>
  );
}

function TaskField({
  label,
  trigger,
}: {
  label: string;
  trigger: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      {trigger}
    </div>
  );
}

function TaskMetaItem({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function InlineTrigger({
  children,
  onClick,
  open,
}: {
  children: React.ReactNode;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  open: boolean;
}) {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-2.5 py-1.5 text-sm font-medium text-zinc-900 transition hover:border-sky-300 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-sky-500/30 dark:hover:text-sky-300"
      onClick={onClick}
      type="button"
    >
      {children}
      <ChevronDown className={open ? "h-3.5 w-3.5 rotate-180 text-zinc-400" : "h-3.5 w-3.5 text-zinc-400"} />
    </button>
  );
}

function FloatingEditorShell({
  children,
  panelRef,
  position,
}: {
  children: React.ReactNode;
  panelRef: React.RefObject<HTMLDivElement | null>;
  position: FloatingPosition | null;
}) {
  if (!position || typeof document === "undefined" || !children) {
    return null;
  }

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-50 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
      style={{
        left: position.left,
        top: position.top,
        width: position.width,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

function FloatingOptionList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className ?? ""}>{children}</div>;
}

function FloatingOptionButton({
  children,
  onClick,
  pending,
  selected,
}: {
  children: React.ReactNode;
  onClick: () => void;
  pending: boolean;
  selected: boolean;
}) {
  return (
    <button
      className={
        selected
          ? "flex w-full items-center justify-between rounded-xl bg-sky-50 px-3 py-2.5 text-left dark:bg-sky-500/10"
          : "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
      }
      disabled={pending}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function FloatingDateEditor({
  onCancel,
  onChange,
  onSave,
  pending,
  value,
}: {
  onCancel: () => void;
  onChange: (value: string) => void;
  onSave: () => void;
  pending: boolean;
  value: string;
}) {
  return (
    <div className="space-y-3 p-2">
      <Input onChange={(event) => onChange(event.target.value)} type="date" value={value} />
      <div className="flex items-center justify-end gap-2">
        <Button onClick={onCancel} type="button" variant="ghost">
          Cancel
        </Button>
        <Button disabled={pending} onClick={onSave} type="button">
          {pending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === "DONE" ? "success" : status === "CANCELLED" ? "danger" : "default"}>
      {formatLabel(status)}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge
      variant={
        priority === "URGENT" ? "danger" : priority === "HIGH" ? "warning" : priority === "LOW" ? "neutral" : "default"
      }
    >
      {formatLabel(priority)}
    </Badge>
  );
}

function formatDateInput(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getFloatingPosition(rect: DOMRect, editor: Exclude<ActiveEditor, null>): FloatingPosition {
  const estimatedHeight = editor === "assignee" ? 320 : editor === "startDate" || editor === "dueDate" ? 180 : 240;
  const width = editor === "assignee" ? 320 : Math.max(220, Math.round(rect.width));
  const gutter = 16;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const left = Math.min(Math.max(gutter, rect.left), viewportWidth - width - gutter);
  const fitsBelow = rect.bottom + 8 + estimatedHeight <= viewportHeight - gutter;
  const top = fitsBelow ? rect.bottom + 8 : Math.max(gutter, rect.top - estimatedHeight - 8);

  return {
    left,
    top,
    width,
  };
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
