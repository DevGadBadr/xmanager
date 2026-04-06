"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { TaskInlineEditor } from "@/components/tasks/task-inline-editor";

type MembershipOption = {
  id: string;
  user: {
    fullName: string | null;
    email: string;
  };
};

type EditableTask = {
  id: string;
  status: string;
  priority: string;
  assignees: Array<{
    membershipId: string;
    user: {
      fullName: string | null;
      email: string;
    };
  }>;
  startDate?: Date | string | null;
  dueDate?: Date | string | null;
};

export function TaskPropertiesPanel({
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
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (containerRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-label={open ? "Hide task properties" : "Show task properties"}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 transition hover:border-zinc-300 hover:bg-white hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-zinc-200 bg-white p-3 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          <TaskInlineEditor
            canManageTasks={canManageTasks}
            memberships={memberships}
            projectName={projectName}
            task={task}
            variant="sidebar"
          />
        </div>
      ) : null}
    </div>
  );
}
