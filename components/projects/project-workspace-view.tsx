"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Filter, LayoutGrid, Rows3, Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { DeleteTaskButton } from "@/components/forms/delete-task-button";
import { useAppNavigation } from "@/components/providers/app-navigation-provider";
import { CreateTaskDialog } from "@/components/projects/create-task-dialog";
import { ProjectContentEditor } from "@/components/projects/project-content-editor";
import { ProjectTaskStatusControl } from "@/components/projects/task-status-control";
import { ProjectTaskTable } from "@/components/projects/task-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PendingLink } from "@/components/shared/pending-link";
import { TaskAssigneeGroup, getTaskAssigneeLabel, type TaskAssigneeView } from "@/components/tasks/task-assignee-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { TASK_STATUS_OPTIONS, isOpenTaskStatus, normalizeTaskStatus } from "@/lib/task-status";
import { cn, formatDate } from "@/lib/utils";

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
  assigneeId: string | null;
  search: string;
  status: string | null;
  viewMode: ViewMode;
};

type ActiveFilters = Pick<StoredProjectFilters, "assigneeId" | "status">;

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

const DEFAULT_PROJECT_FILTERS: StoredProjectFilters = {
  assigneeId: null,
  search: "",
  status: null,
  viewMode: "list",
};
const BOARD_COLUMNS: BoardColumn[] = [
  {
    id: "open",
    title: "Open",
    statuses: ["OPEN"],
  },
  {
    id: "in-progress",
    title: "In progress",
    statuses: ["IN_PROGRESS"],
  },
  {
    id: "closed",
    title: "Closed",
    statuses: ["CLOSED"],
  },
  {
    id: "hold",
    title: "Hold",
    statuses: ["HOLD"],
  },
];

export function ProjectWorkspaceView({
  canEditProjectContent,
  canManageTasks,
  memberships,
  projectDescription,
  projectName,
  projects,
  tasks,
  selectedProjectId,
  storageScope,
}: {
  canEditProjectContent: boolean;
  canManageTasks: boolean;
  memberships: Array<{ id: string; user: { fullName: string | null; email: string; image: string | null } }>;
  projectDescription: string | null;
  projectName: string;
  projects: ProjectOption[];
  tasks: TaskRow[];
  selectedProjectId: string;
  storageScope: string;
}) {
  const pathname = usePathname();
  const [storedFilters, setStoredFilters] = useState<StoredProjectFilters>(DEFAULT_PROJECT_FILTERS);
  const [expandedSearchProjectId, setExpandedSearchProjectId] = useState<string | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [filtersVisibleReady, setFiltersVisibleReady] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const assigneeId = storedFilters.assigneeId;
  const search = storedFilters.search;
  const status = storedFilters.status;
  const viewMode = storedFilters.viewMode;
  const deferredSearch = useDeferredValue(search);
  const isSearchOpen = Boolean(search) || expandedSearchProjectId === selectedProjectId;

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(getProjectFilterVisibilityStorageKey(storageScope));

      if (storedValue !== null) {
        setFiltersVisible(storedValue === "true");
      }
    } catch {
      // Ignore storage access failures and keep the default visible state.
    } finally {
      setFiltersVisibleReady(true);
    }
  }, [storageScope]);

  useEffect(() => {
    if (!filtersVisibleReady) {
      return;
    }

    try {
      window.localStorage.setItem(getProjectFilterVisibilityStorageKey(storageScope), String(filtersVisible));
    } catch {
      // Ignore storage access failures and keep the in-memory state only.
    }
  }, [filtersVisible, filtersVisibleReady, storageScope]);

  useEffect(() => {
    setStoredFilters(DEFAULT_PROJECT_FILTERS);
    setExpandedSearchProjectId(null);
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

  const visibleTasks = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLocaleLowerCase();

    return tasks.filter((task) => {
      if (assigneeId && !task.assignees.some((assignee) => assignee.membershipId === assigneeId)) {
        return false;
      }

      const normalizedTaskStatus = normalizeTaskStatus(task.status);

      if (status && normalizedTaskStatus !== status) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [task.title, task.description ?? ""].some((value) => value.toLocaleLowerCase().includes(normalizedSearch));
    });
  }, [assigneeId, deferredSearch, status, tasks]);

  const boardColumns = useMemo(
    () =>
      BOARD_COLUMNS.map((column) => ({
        ...column,
        tasks: visibleTasks.filter((task) => {
          const normalizedTaskStatus = normalizeTaskStatus(task.status);

          return normalizedTaskStatus ? column.statuses.includes(normalizedTaskStatus) : column.statuses.includes(task.status);
        }),
      })),
    [visibleTasks],
  );

  const taskAssignees = useMemo(() => {
    const uniqueAssignees = new Map<string, { id: string; label: string }>();

    for (const task of tasks) {
      for (const assignee of task.assignees) {
        if (!uniqueAssignees.has(assignee.membershipId)) {
          uniqueAssignees.set(assignee.membershipId, {
            id: assignee.membershipId,
            label: getTaskAssigneeLabel(assignee),
          });
        }
      }
    }

    return Array.from(uniqueAssignees.values()).sort((left, right) => left.label.localeCompare(right.label));
  }, [tasks]);

  const openTaskCount = useMemo(
    () => tasks.filter((task) => isOpenTaskStatus(task.status)).length,
    [tasks],
  );

  const toggleAssigneeFilter = (membershipId: string) => {
    setStoredFilters((current) => ({
      ...current,
      status: null,
      assigneeId: current.assigneeId === membershipId ? null : membershipId,
    }));
  };

  const setSearch = (value: string) => {
    setStoredFilters((current) => ({
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
    setStoredFilters((current) => ({
      ...current,
      viewMode: nextViewMode,
    }));
  };

  const toggleStatusFilter = (status: string) => {
    setStoredFilters((current) => ({
      ...current,
      assigneeId: null,
      status: current.status === status ? null : status,
    }));
  };

  const toggleFiltersVisible = () => {
    setFiltersVisible((current) => !current);
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
                    <MetricChip label="Assignees" value={String(taskAssignees.length)} />
                    {canEditProjectContent ? (
                      <ProjectContentEditor
                        canEditContent
                        description={projectDescription}
                        name={projectName}
                        projectId={selectedProjectId}
                        trigger="icon"
                      />
                    ) : null}
                    <Button
                      aria-controls="project-filter-panel"
                      aria-expanded={filtersVisible}
                      aria-label={filtersVisible ? "Hide filters" : "Show filters"}
                      className={cn("h-8 w-8 shrink-0 rounded-full", filtersVisible && "bg-zinc-100 dark:bg-zinc-800")}
                      onClick={toggleFiltersVisible}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
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

        {filtersVisible ? (
          <div
            className="mt-3 space-y-3 border-t border-zinc-200 pt-3 dark:border-zinc-800"
            id="project-filter-panel"
          >
            <div className="flex flex-col gap-3 xl:grid xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-start xl:gap-6">
              <div className="min-w-0">
                <ProjectFilterSection label="Status">
                  {TASK_STATUS_OPTIONS.map((option) => {
                    const selected = status === option.value;

                    return (
                      <button
                        aria-pressed={selected}
                        className="appearance-none rounded-full border-0"
                        key={option.value}
                        onClick={() => toggleStatusFilter(option.value)}
                        type="button"
                      >
                        <Badge
                          className={cn(
                            "px-2.5 py-1 text-[10px] transition",
                            !selected && "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
                          )}
                          variant={selected ? "default" : "neutral"}
                        >
                          {option.label}
                        </Badge>
                      </button>
                    );
                  })}
                </ProjectFilterSection>
              </div>

              <div className="min-w-0">
                <ProjectFilterSection label="Assignees">
                  {taskAssignees.length > 0 ? (
                    taskAssignees.map((assignee) => {
                      const selected = assigneeId === assignee.id;

                      return (
                        <button
                          aria-pressed={selected}
                          className="appearance-none rounded-full border-0"
                          key={assignee.id}
                          onClick={() => toggleAssigneeFilter(assignee.id)}
                          type="button"
                        >
                          <Badge
                            className={cn(
                              "px-2.5 py-1 text-[10px] transition",
                              !selected && "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
                            )}
                            variant={selected ? "default" : "neutral"}
                          >
                            {assignee.label}
                          </Badge>
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">No assignees on tasks yet.</p>
                  )}
                </ProjectFilterSection>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {visibleTasks.length > 0 ? (
        viewMode === "board" ? (
          <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden xl:h-full">
            <ProjectTaskBoard
              activeFilters={{ assigneeId, status }}
              canManageTasks={canManageTasks}
              columns={boardColumns}
              onAssigneeClick={toggleAssigneeFilter}
              returnTo={pathname}
            />
          </div>
        ) : (
            <ProjectTaskTable
              activeFilters={{ assigneeId, status }}
              canManageTasks={canManageTasks}
              onAssigneeClick={toggleAssigneeFilter}
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

function ProjectTaskBoard({
  activeFilters,
  canManageTasks,
  columns,
  onAssigneeClick,
  returnTo,
}: {
  activeFilters: ActiveFilters;
  canManageTasks: boolean;
  columns: Array<BoardColumn & { tasks: TaskRow[] }>;
  onAssigneeClick: (membershipId: string) => void;
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
                <ProjectTaskBoardCard
                  activeFilters={activeFilters}
                  canManageTasks={canManageTasks}
                  key={task.id}
                  onAssigneeClick={onAssigneeClick}
                  returnTo={returnTo}
                  router={router}
                  startNavigation={startNavigation}
                  task={task}
                />
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

function ProjectTaskBoardCard({
  activeFilters,
  canManageTasks,
  onAssigneeClick,
  returnTo,
  router,
  startNavigation,
  task,
}: {
  activeFilters: ActiveFilters;
  canManageTasks: boolean;
  onAssigneeClick: (membershipId: string) => void;
  returnTo: string;
  router: ReturnType<typeof useRouter>;
  startNavigation: ReturnType<typeof useAppNavigation>["startNavigation"];
  task: TaskRow;
}) {
  return (
    <div
      className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 text-left transition hover:border-sky-200 hover:bg-sky-50/60 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-sky-500/30 dark:hover:bg-sky-500/10"
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
          <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
            <ProjectTaskStatusControl canManageTasks={canManageTasks} task={task} />
          </div>
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
        <div
          className={cn(
            "rounded-full px-1.5 py-1",
            activeFilters.assigneeId &&
              task.assignees.some((assignee) => assignee.membershipId === activeFilters.assigneeId) &&
              "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
          )}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <TaskAssigneeGroup
            activeMembershipId={activeFilters.assigneeId}
            assignees={task.assignees}
            onAssigneeClick={onAssigneeClick}
          />
        </div>

        <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(task.dueDate)}</span>
      </div>
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

function ProjectFilterSection({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:gap-3">
      <span className="flex shrink-0 items-center justify-center text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400 xl:min-w-20 xl:self-stretch">
        {label}
      </span>
      <div className="flex flex-wrap items-center justify-center gap-2 xl:flex-1 xl:justify-start">{children}</div>
    </div>
  );
}

function getProjectFilterVisibilityStorageKey(storageScope: string) {
  return `xmanager:project-workspace:${storageScope}:filters-visible`;
}
