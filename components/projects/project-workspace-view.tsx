"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { LayoutGrid, Rows3, Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { DeleteTaskButton } from "@/components/forms/delete-task-button";
import { useAppNavigation } from "@/components/providers/app-navigation-provider";
import { CreateTaskDialog } from "@/components/projects/create-task-dialog";
import { ProjectContentEditor } from "@/components/projects/project-content-editor";
import { ProjectTaskTable } from "@/components/projects/task-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PendingLink } from "@/components/shared/pending-link";
import { TaskAssigneeGroup, type TaskAssigneeView } from "@/components/tasks/task-assignee-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn, formatDate } from "@/lib/utils";

type AssigneeOption = {
  id: string;
  label: string;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  startDate: Date | string | null;
  dueDate: Date | string | null;
  assignees: TaskAssigneeView[];
};

type StoredProjectFilters = {
  activeQuickFilter: QuickFilter;
  search: string;
  viewMode: ViewMode;
};

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

type ViewMode = "list" | "board";

type BoardColumn = {
  id: "open" | "in-progress" | "closed" | "hold";
  title: string;
  statuses: string[];
};

type ProjectOption = {
  id: string;
  name: string;
  openTaskCount: number;
  status: string | null;
};

const PROJECT_FILTER_STORAGE_KEY = "xmanager:project-filters";
const PROJECT_FILTERS_STORAGE_EVENT = "xmanager:project-filters-changed";
const DEFAULT_PROJECT_FILTERS: StoredProjectFilters = {
  activeQuickFilter: null,
  search: "",
  viewMode: "list",
};
const BOARD_COLUMNS: BoardColumn[] = [
  {
    id: "open",
    title: "Open",
    statuses: ["TODO"],
  },
  {
    id: "in-progress",
    title: "In progress",
    statuses: ["IN_PROGRESS", "IN_REVIEW"],
  },
  {
    id: "closed",
    title: "Closed",
    statuses: ["DONE"],
  },
  {
    id: "hold",
    title: "Hold",
    statuses: ["CANCELLED"],
  },
];

export function ProjectWorkspaceView({
  assignees,
  canEditProjectContent,
  canManageTasks,
  memberships,
  ownerLabel,
  projectDescription,
  projectName,
  projects,
  tasks,
  selectedProjectId,
}: {
  assignees: AssigneeOption[];
  canEditProjectContent: boolean;
  canManageTasks: boolean;
  memberships: Array<{ id: string; user: { fullName: string | null; email: string } }>;
  ownerLabel: string;
  projectDescription: string | null;
  projectName: string;
  projects: ProjectOption[];
  tasks: TaskRow[];
  selectedProjectId: string;
}) {
  const pathname = usePathname();
  const [storedFilters, setStoredFilters] = useState<StoredProjectFilters>(DEFAULT_PROJECT_FILTERS);
  const [expandedSearchProjectId, setExpandedSearchProjectId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const search = storedFilters.search;
  const viewMode = storedFilters.viewMode;
  const activeQuickFilter = storedFilters.activeQuickFilter;
  const deferredSearch = useDeferredValue(search);
  const isSearchOpen = Boolean(search) || expandedSearchProjectId === selectedProjectId;

  useEffect(() => {
    const syncFromStorage = () => {
      setStoredFilters(readStoredProjectFilters(selectedProjectId, readStoredProjectFiltersSnapshot()) ?? DEFAULT_PROJECT_FILTERS);
    };

    syncFromStorage();
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(PROJECT_FILTERS_STORAGE_EVENT, syncFromStorage);

    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(PROJECT_FILTERS_STORAGE_EVENT, syncFromStorage);
    };
  }, [selectedProjectId]);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isSearchOpen]);

  const assigneeLabelById = useMemo(
    () => new Map(assignees.map((assignee) => [assignee.id, assignee.label])),
    [assignees],
  );

  const visibleTasks = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLocaleLowerCase();

    return tasks.filter((task) => {
      if (
        activeQuickFilter?.type === "assignee" &&
        !task.assignees.some((assignee) => assignee.membershipId === activeQuickFilter.value)
      ) {
        return false;
      }

      if (activeQuickFilter?.type === "status" && task.status !== activeQuickFilter.value) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [task.title, task.description ?? ""].some((value) => value.toLocaleLowerCase().includes(normalizedSearch));
    });
  }, [activeQuickFilter, deferredSearch, tasks]);

  const activeFilterLabel = useMemo(() => {
    if (!activeQuickFilter) {
      return null;
    }

    if (activeQuickFilter.type === "assignee") {
      return `Assignee: ${assigneeLabelById.get(activeQuickFilter.value) ?? "Unknown"}`;
    }

    return `Status: ${formatTaskStatus(activeQuickFilter.value)}`;
  }, [activeQuickFilter, assigneeLabelById]);

  const boardColumns = useMemo(
    () =>
      BOARD_COLUMNS.map((column) => ({
        ...column,
        tasks: visibleTasks.filter((task) => column.statuses.includes(task.status)),
      })),
    [visibleTasks],
  );

  const openTaskCount = useMemo(
    () => tasks.filter((task) => task.status !== "DONE" && task.status !== "CANCELLED").length,
    [tasks],
  );

  const toggleAssigneeFilter = (membershipId: string) => {
    setAndPersistStoredProjectFilters(selectedProjectId, setStoredFilters, (current) => ({
      ...current,
      activeQuickFilter:
        current.activeQuickFilter?.type === "assignee" && current.activeQuickFilter.value === membershipId
          ? null
          : { type: "assignee", value: membershipId },
    }));
  };

  const setSearch = (value: string) => {
    setAndPersistStoredProjectFilters(selectedProjectId, setStoredFilters, (current) => ({
      ...current,
      search: value,
    }));
  };

  const toggleSearch = () => {
    if (isSearchOpen) {
      setExpandedSearchProjectId(null);
      setSearch("");
      return;
    }

    setExpandedSearchProjectId(selectedProjectId);
  };

  const setViewMode = (nextViewMode: ViewMode) => {
    setAndPersistStoredProjectFilters(selectedProjectId, setStoredFilters, (current) => ({
      ...current,
      viewMode: nextViewMode,
    }));
  };

  const clearQuickFilter = () => {
    setAndPersistStoredProjectFilters(selectedProjectId, setStoredFilters, (current) => ({
      ...current,
      activeQuickFilter: null,
    }));
  };

  const toggleStatusFilter = (status: string) => {
    setAndPersistStoredProjectFilters(selectedProjectId, setStoredFilters, (current) => ({
      ...current,
      activeQuickFilter:
        current.activeQuickFilter?.type === "status" && current.activeQuickFilter.value === status
          ? null
          : { type: "status", value: status },
    }));
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 xl:grid xl:min-h-0 xl:grid-rows-[auto_minmax(0,1fr)]">
      <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:px-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between xl:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4 xl:items-center">
              <div>
                <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
                  Project
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4 xl:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center">
                      <DropdownMenu>
                        <div className="flex min-w-0 flex-1 items-center">
                          <h1 className="min-w-0 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-2xl">
                            <DropdownMenuTrigger asChild>
                              <button
                                aria-label="Choose project"
                                className="max-w-full truncate rounded-lg text-left transition hover:text-sky-700 focus-visible:ring-2 focus-visible:ring-sky-500 dark:hover:text-sky-300"
                                type="button"
                              >
                                <span className="truncate">
                                  {projectName}
                                </span>
                              </button>
                            </DropdownMenuTrigger>
                          </h1>
                        </div>
                        <DropdownMenuContent align="start" className="max-h-[22rem] w-[22rem] overflow-y-auto">
                          {projects.map((project) => (
                            <DropdownMenuItem asChild key={project.id}>
                              <PendingLink
                                busyMessage="Loading project..."
                                className={cn(
                                  "flex items-center justify-between gap-3",
                                  project.id === selectedProjectId && "bg-zinc-100 dark:bg-zinc-800",
                                )}
                                href={`/projects/${project.id}`}
                              >
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="truncate font-medium text-zinc-950 dark:text-zinc-50">{project.name}</span>
                                    {project.status ? <Badge variant="default">{project.status}</Badge> : null}
                                  </div>
                                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{project.openTaskCount} open tasks</p>
                                </div>
                                {project.id === selectedProjectId ? (
                                  <span className="text-xs font-medium text-sky-600 dark:text-sky-300">Current</span>
                                ) : null}
                              </PendingLink>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
                    <div className="flex items-center gap-2">
                      <Button
                        aria-controls="project-task-search"
                        aria-expanded={isSearchOpen}
                        aria-label={isSearchOpen ? "Close task search" : "Open task search"}
                        className="h-8 w-8 shrink-0 rounded-full"
                        onClick={toggleSearch}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        {isSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                      </Button>
                      <div
                        aria-hidden={!isSearchOpen}
                        className={cn(
                          "min-w-0 overflow-hidden transition-[width,opacity,transform] duration-300 ease-out",
                          isSearchOpen
                            ? "w-[8.5rem] origin-left scale-x-100 opacity-100 sm:w-[10rem] lg:w-[12rem]"
                            : "pointer-events-none w-0 origin-left scale-x-95 opacity-0",
                        )}
                      >
                        <Input
                          id="project-task-search"
                          ref={searchInputRef}
                          className="h-8 w-full"
                          onChange={(event) => setSearch(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") {
                              toggleSearch();
                            }
                          }}
                          placeholder="Search tasks"
                          tabIndex={isSearchOpen ? 0 : -1}
                          type="search"
                          value={search}
                        />
                      </div>
                    </div>
                    <MetricChip label="Open tasks" value={String(openTaskCount)} />
                    <MetricChip label="Members" value={String(assignees.length)} />
                    <MetricChip label="Owner" value={ownerLabel} />
                    {canEditProjectContent ? (
                      <ProjectContentEditor
                        canEditContent
                        description={projectDescription}
                        name={projectName}
                        projectId={selectedProjectId}
                        trigger="icon"
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:flex-none">
            <div className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-950/60">
              <Button
                className="h-8 px-2.5"
                onClick={() => setViewMode("list")}
                size="sm"
                type="button"
                variant={viewMode === "list" ? "secondary" : "ghost"}
              >
                <Rows3 className="h-3.5 w-3.5" />
                List
              </Button>
              <Button
                className="h-8 px-2.5"
                onClick={() => setViewMode("board")}
                size="sm"
                type="button"
                variant={viewMode === "board" ? "secondary" : "ghost"}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Board
              </Button>
            </div>
            <CreateTaskDialog className="w-full justify-center sm:w-auto" memberships={memberships} projectId={selectedProjectId} />
          </div>
        </div>

        {activeFilterLabel ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <div className="flex min-h-8 items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                Quick filter
              </span>
              <Badge className="px-2.5 py-1 text-[10px]" variant="default">
                {activeFilterLabel}
              </Badge>
            </div>

            <Button className="h-8 px-2.5 text-xs" onClick={clearQuickFilter} type="button" variant="ghost">
              Clear
            </Button>
          </div>
        ) : null}
      </div>

      {visibleTasks.length > 0 ? (
        viewMode === "board" ? (
          <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden xl:h-full">
            <ProjectTaskBoard
              activeQuickFilter={activeQuickFilter}
              canManageTasks={canManageTasks}
              columns={boardColumns}
              onAssigneeClick={toggleAssigneeFilter}
              onStatusClick={toggleStatusFilter}
              returnTo={pathname}
            />
          </div>
        ) : (
          <ProjectTaskTable
            activeQuickFilter={activeQuickFilter}
            canManageTasks={canManageTasks}
            onAssigneeClick={toggleAssigneeFilter}
            onStatusClick={toggleStatusFilter}
            returnTo={pathname}
            tasks={visibleTasks}
          />
        )
      ) : (
        <EmptyState
          description="No tasks match the current filters. Try another person, status, or search term, or add a new task."
          title="No visible tasks"
        />
      )}
    </div>
  );
}

function readStoredProjectFilters(projectId: string, rawValue: string | null) {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Record<
      string,
      StoredProjectFilters | { assigneeId?: string; search?: string; viewMode?: ViewMode }
    >;
    const filters = parsed[projectId];

    if (!filters) {
      return null;
    }

    if ("activeQuickFilter" in filters) {
      return filters;
    }

    return {
      activeQuickFilter: filters.assigneeId ? ({ type: "assignee", value: filters.assigneeId } as const) : null,
      search: filters.search ?? "",
      viewMode: filters.viewMode ?? "list",
    };
  } catch {
    return null;
  }
}

function readStoredProjectFiltersSnapshot() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.sessionStorage.getItem(PROJECT_FILTER_STORAGE_KEY) ?? "";
}

function writeStoredProjectFilters(projectId: string, filters: StoredProjectFilters) {
  if (typeof window === "undefined") {
    return;
  }

  const nextValue = {
    ...(readStoredProjectFiltersMap() ?? {}),
    [projectId]: filters,
  };

  window.sessionStorage.setItem(PROJECT_FILTER_STORAGE_KEY, JSON.stringify(nextValue));
  window.dispatchEvent(new Event(PROJECT_FILTERS_STORAGE_EVENT));
}

function setAndPersistStoredProjectFilters(
  projectId: string,
  setStoredFilters: Dispatch<SetStateAction<StoredProjectFilters>>,
  update: (current: StoredProjectFilters) => StoredProjectFilters,
) {
  setStoredFilters((current) => {
    const nextFilters = update(current);
    writeStoredProjectFilters(projectId, nextFilters);
    return nextFilters;
  });
}

function readStoredProjectFiltersMap() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(PROJECT_FILTER_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as Record<string, StoredProjectFilters>;
  } catch {
    return null;
  }
}

function formatTaskStatus(status: string) {
  return status.replaceAll("_", " ");
}

function ProjectTaskBoard({
  activeQuickFilter,
  canManageTasks,
  columns,
  onAssigneeClick,
  onStatusClick,
  returnTo,
}: {
  activeQuickFilter: QuickFilter;
  canManageTasks: boolean;
  columns: Array<BoardColumn & { tasks: TaskRow[] }>;
  onAssigneeClick: (membershipId: string) => void;
  onStatusClick: (status: string) => void;
  returnTo: string;
}) {
  const router = useRouter();
  const { isBusy, startNavigation } = useAppNavigation();

  return (
    <div
      aria-busy={isBusy}
      className={cn(
        "grid h-full min-h-0 min-w-0 w-full flex-1 grid-cols-1 gap-3 md:auto-rows-fr md:grid-cols-2 xl:grid-cols-4",
        isBusy && "pointer-events-none opacity-70",
      )}
    >
      {columns.map((column) => (
        <Card className="flex h-full min-h-[26rem] min-w-0 flex-col overflow-hidden md:min-h-0" key={column.id}>
          <CardHeader className="border-b border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/70">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm sm:text-base">{column.title}</CardTitle>
              <Badge variant="neutral">{column.tasks.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
            {column.tasks.length > 0 ? (
              column.tasks.map((task) => (
                <div
                  className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 text-left transition hover:border-sky-200 hover:bg-sky-50/60 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-sky-500/30 dark:hover:bg-sky-500/10"
                  key={task.id}
                  onClick={() => {
                    const href = `/tasks/${task.id}?returnTo=${encodeURIComponent(returnTo)}`;

                    startNavigation(href, "Opening task...");
                    router.push(href, {
                      scroll: false,
                    });
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") {
                      return;
                    }

                    event.preventDefault();

                    const href = `/tasks/${task.id}?returnTo=${encodeURIComponent(returnTo)}`;

                    startNavigation(href, "Opening task...");
                    router.push(href, {
                      scroll: false,
                    });
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">{task.title}</p>
                    <div className="flex items-start gap-2">
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
                            "shrink-0 transition",
                            activeQuickFilter?.type === "status" && activeQuickFilter.value === task.status
                              ? ""
                              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
                          )}
                          variant={activeQuickFilter?.type === "status" && activeQuickFilter.value === task.status ? "default" : "neutral"}
                        >
                          {formatTaskStatus(task.status)}
                        </Badge>
                      </button>
                      {canManageTasks ? (
                        <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                          <DeleteTaskButton taskId={task.id} taskTitle={task.title} />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {task.description ? (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{task.description}</p>
                  ) : null}

                  <div className="mt-3 flex items-center justify-between gap-3">
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

                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(task.dueDate)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-200 px-3 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                No tasks
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MetricChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50/90 px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-950/60">
      <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">{label}</p>
      <p className="max-w-[12rem] truncate text-xs font-medium text-zinc-950 dark:text-zinc-50">{value}</p>
    </div>
  );
}
