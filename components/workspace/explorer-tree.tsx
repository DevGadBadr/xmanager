"use client";

import { useEffect, useState } from "react";
import { KanbanSquare, MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PendingLink } from "@/components/shared/pending-link";
import { cn } from "@/lib/utils";

type TaskNode = {
  id: string;
  name: string;
  status?: string;
};

type AssetNode = {
  id: string;
  name: string;
  key?: string;
  status?: string;
  taskCount?: number;
  openTaskCount?: number;
  tasks?: TaskNode[];
};

export function ExplorerTree({
  title,
  basePath,
  assets,
  selectedAssetId,
  storageScope,
  selectedTaskId,
  variant = "panel",
  onSelect,
}: {
  title: string;
  basePath: string;
  assets: AssetNode[];
  selectedAssetId?: string | null;
  storageScope?: string;
  selectedTaskId?: string | null;
  variant?: "panel" | "sidebar";
  onSelect?: () => void;
}) {
  const isSidebar = variant === "sidebar";
  const [expandedProjectTasks, setExpandedProjectTasks] = useState<Record<string, boolean>>({});
  const [expandedProjectTasksReady, setExpandedProjectTasksReady] = useState(!isSidebar);

  useEffect(() => {
    if (!isSidebar || !storageScope) {
      setExpandedProjectTasksReady(true);
      return;
    }

    try {
      const storedValue = window.localStorage.getItem(getProjectTasksVisibilityStorageKey(storageScope));

      if (storedValue) {
        const parsed = JSON.parse(storedValue);

        if (parsed && typeof parsed === "object") {
          setExpandedProjectTasks(
            Object.fromEntries(
              Object.entries(parsed).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean"),
            ),
          );
        }
      }
    } catch {
      // Ignore storage access failures and keep the default in-memory state.
    } finally {
      setExpandedProjectTasksReady(true);
    }
  }, [isSidebar, storageScope]);

  useEffect(() => {
    if (!isSidebar || !storageScope || !expandedProjectTasksReady) {
      return;
    }

    try {
      window.localStorage.setItem(
        getProjectTasksVisibilityStorageKey(storageScope),
        JSON.stringify(expandedProjectTasks),
      );
    } catch {
      // Ignore storage access failures and keep the in-memory state only.
    }
  }, [expandedProjectTasks, expandedProjectTasksReady, isSidebar, storageScope]);

  return (
    <div className={cn("space-y-4", isSidebar && "space-y-1.5")}>
      {isSidebar ? (
        <div className="px-2 pt-0.5" />
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Explorer</p>
            <h2 className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">{title}</h2>
          </div>
          <Badge variant="neutral">{assets.length} projects</Badge>
        </div>
      )}

      <div className="space-y-1">
        {assets.map((asset) => (
          <ExplorerProjectNode
            asset={asset}
            basePath={basePath}
            isSidebar={isSidebar}
            key={asset.id}
            onSelect={onSelect}
            selectedAssetId={selectedAssetId}
            selectedTaskId={selectedTaskId}
            tasksExpanded={expandedProjectTasks[asset.id]}
            onToggleTasks={() =>
              setExpandedProjectTasks((current) => ({
                ...current,
                [asset.id]: !current[asset.id],
              }))
            }
          />
        ))}
      </div>
    </div>
  );
}

function ExplorerProjectNode({
  asset,
  basePath,
  isSidebar,
  onSelect,
  selectedAssetId,
  selectedTaskId,
  tasksExpanded,
  onToggleTasks,
}: {
  asset: AssetNode;
  basePath: string;
  isSidebar: boolean;
  onSelect?: () => void;
  selectedAssetId?: string | null;
  selectedTaskId?: string | null;
  tasksExpanded?: boolean;
  onToggleTasks: () => void;
}) {
  const hasTasks = isSidebar && (asset.tasks?.length ?? 0) > 0;
  const projectIsActive = selectedAssetId === asset.id;
  const nextTasksExpanded = tasksExpanded ?? false;

  return (
    <div className="space-y-1">
      <div className="relative">
        <PendingLink
          busyMessage="Loading project..."
          className={cn(
            "flex items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-[14.3px] transition leading-tight",
            hasTasks && "pr-10",
            projectIsActive
              ? "border-sky-200 bg-sky-50 text-zinc-950 shadow-sm dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-zinc-50"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
          )}
          href={`${basePath}/${asset.id}`}
          onClick={onSelect}
        >
          <KanbanSquare
            className={cn(
              "h-4 w-4 shrink-0",
              projectIsActive && "text-sky-700 dark:text-sky-300",
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{asset.name}</p>
          </div>
          {!isSidebar ? (
            <span
              className={cn(
                "rounded-full bg-black/8 px-2 py-1 text-[11px] font-medium dark:bg-white/10",
                projectIsActive &&
                  "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200",
              )}
            >
              {asset.openTaskCount ?? asset.taskCount ?? 0}
            </span>
          ) : null}
        </PendingLink>

        {hasTasks ? (
          <button
            aria-label={nextTasksExpanded ? `Hide tasks for ${asset.name}` : `Show tasks for ${asset.name}`}
            className={cn(
              "absolute right-1 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md transition",
              projectIsActive
                ? "text-sky-700 hover:bg-sky-100 dark:text-sky-300 dark:hover:bg-sky-500/15"
                : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
            )}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleTasks();
            }}
            type="button"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {hasTasks && nextTasksExpanded ? (
        <div className="ml-5 border-l border-zinc-200 pl-2 dark:border-zinc-800">
          <div className="space-y-1">
            {asset.tasks?.map((task) => {
              const taskActive = selectedTaskId === task.id;

              return (
                <PendingLink
                  busyMessage="Opening task..."
                  className={cn(
                    "block rounded-md px-2 py-1.5 text-[13px] leading-tight transition",
                    taskActive
                      ? "bg-sky-50 text-sky-800 shadow-sm dark:bg-sky-500/10 dark:text-sky-200"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                  )}
                  href={`/tasks/${task.id}?returnTo=${encodeURIComponent(`${basePath}/${asset.id}`)}`}
                  key={task.id}
                  onClick={onSelect}
                >
                  <p className="truncate font-medium">{task.name}</p>
                </PendingLink>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getProjectTasksVisibilityStorageKey(storageScope: string) {
  return `xmanager:sidebar:${storageScope}:project-task-visibility`;
}
