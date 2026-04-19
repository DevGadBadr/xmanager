"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Bell,
  FolderKanban,
  LayoutDashboard,
  PanelLeftClose,
  Settings,
  Shield,
  Users,
} from "lucide-react";

import { AppLogo } from "@/components/shared/app-logo";
import { PendingLink } from "@/components/shared/pending-link";
import { ExplorerTree } from "@/components/workspace/explorer-tree";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teams", label: "Teams", icon: Shield },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/users", label: "Users", icon: Users },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar({
  workspaceName,
  explorer,
  storageScope,
  collapsed = false,
  mode = "desktop",
  onNavigate,
  onToggleSidebar,
}: {
  workspaceName: string;
  explorer: {
    projects: Array<{
      id: string;
      name: string;
      key?: string;
      status?: string;
      taskCount?: number;
      openTaskCount?: number;
      tasks?: Array<{
        id: string;
        name: string;
        status?: string;
      }>;
    }>;
  };
  storageScope: string;
  collapsed?: boolean;
  mode?: "desktop" | "mobile";
  onNavigate?: () => void;
  onToggleSidebar?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isProjectsRoute = pathname === "/projects" || pathname.startsWith("/projects/");
  const returnTo = searchParams.get("returnTo");
  const projectIdFromReturnTo = returnTo?.match(/^\/projects\/([^/?#]+)/)?.[1] ?? null;
  const selectedProjectId = pathname.startsWith("/projects/")
    ? pathname.split("/")[2] ?? null
    : projectIdFromReturnTo;
  const isProjectsContext = isProjectsRoute || Boolean(projectIdFromReturnTo);
  const isMobile = mode === "mobile";
  const isCollapsed = !isMobile && collapsed;
  const [projectsExpanded, setProjectsExpanded] = useState(false);
  const [projectsExpandedReady, setProjectsExpandedReady] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(getProjectsVisibilityStorageKey(storageScope));

      if (storedValue !== null) {
        setProjectsExpanded(storedValue === "true");
      }
    } catch {
      // Ignore storage access failures and keep the default visible state.
    } finally {
      setProjectsExpandedReady(true);
    }
  }, [storageScope]);

  useEffect(() => {
    if (!projectsExpandedReady) {
      return;
    }

    try {
      window.localStorage.setItem(getProjectsVisibilityStorageKey(storageScope), String(projectsExpanded));
    } catch {
      // Ignore storage access failures and keep the in-memory state only.
    }
  }, [projectsExpanded, projectsExpandedReady, storageScope]);

  return (
    <aside
      className={cn(
        "flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-50",
        isMobile
          ? "h-full bg-[#f7f9fc] px-3 py-4 dark:bg-zinc-950"
          : cn(
              "hidden h-screen shrink-0 border-r border-zinc-200 bg-[#f7f9fc] py-4 transition-[width,padding] duration-300 ease-[cubic-bezier(0.2,0,0,1)] dark:border-zinc-800 dark:bg-zinc-950 lg:flex",
              isCollapsed ? "w-[4.75rem] px-2" : "w-64 px-3",
            ),
      )}
    >
      <div
        aria-label={workspaceName}
        className={cn(
          "mb-5 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-[height,padding,margin] duration-300 ease-[cubic-bezier(0.2,0,0,1)] dark:border-zinc-800 dark:bg-zinc-900",
          isCollapsed ? "flex h-12 items-center justify-center px-2 py-0" : "px-3.5 py-2",
        )}
      >
        <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "justify-between")}>
          <div className="min-w-0">
            {isCollapsed ? (
              <button
                aria-label="Expand sidebar"
                className="flex h-7 w-7 items-center overflow-hidden rounded-md transition hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                onClick={onToggleSidebar}
                title="Expand sidebar"
                type="button"
              >
                <AppLogo
                  className="h-7 w-7 overflow-hidden"
                  imageClassName="h-7 w-auto max-w-none"
                />
              </button>
            ) : (
              <AppLogo imageClassName="h-7 w-auto" />
            )}
            {isMobile ? (
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                {workspaceName}
              </p>
            ) : null}
          </div>
          {!isMobile && !isCollapsed ? (
            <button
              aria-label="Collapse sidebar"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              onClick={onToggleSidebar}
              title="Collapse sidebar"
              type="button"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <nav className={cn("min-h-0 flex-1 space-y-1 overflow-y-auto", isCollapsed ? "pr-0" : "pr-1")}>
        {navigation.map((item) => {
          const Icon = item.icon;
          const isProjectsItem = item.href === "/projects";
          const active = isProjectsItem
            ? isProjectsContext
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <div key={item.href} className={cn("space-y-2", isProjectsItem && projectsExpanded && "space-y-0.5")}>
              {isProjectsItem ? (
                <div className="relative">
                  <PendingLink
                    busyMessage={`Opening ${item.label.toLowerCase()}...`}
                    className={cn(
                      "flex min-w-0 items-center rounded-xl text-[14.3px] font-medium leading-tight transition",
                      isCollapsed ? "h-10 justify-center px-0" : "gap-2.5 px-3 py-2 pr-11",
                      active
                        ? "bg-sky-600 text-white shadow-sm"
                        : "text-zinc-600 hover:bg-white hover:text-zinc-950 hover:shadow-sm dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
                    )}
                    href={item.href}
                    onClick={() => {
                      onNavigate?.();
                    }}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-3.5 w-3.5")} />
                    <span
                      className={cn(
                        "truncate whitespace-nowrap transition-[max-width,opacity] duration-200",
                        isCollapsed ? "max-w-0 opacity-0" : "max-w-36 opacity-100",
                      )}
                    >
                      {item.label}
                    </span>
                  </PendingLink>

                  {!isCollapsed ? (
                    <button
                      aria-label={projectsExpanded ? "Hide project list" : "Show project list"}
                      className={cn(
                        "absolute inset-y-1 right-1 inline-flex w-7 items-center justify-center rounded-md text-zinc-400 transition",
                        active
                          ? "text-white/80 hover:bg-white/12 hover:text-white"
                          : "hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                      )}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setProjectsExpanded((current) => !current);
                      }}
                      type="button"
                    >
                      <span aria-hidden="true" className="block text-base leading-none">
                        &middot;&middot;&middot;
                      </span>
                    </button>
                  ) : null}
                </div>
              ) : (
                <PendingLink
                  busyMessage={`Opening ${item.label.toLowerCase()}...`}
                  className={cn(
                    "flex items-center rounded-xl text-[14.3px] font-medium leading-tight transition",
                    isCollapsed ? "h-10 justify-center px-0" : "gap-2.5 px-3 py-2",
                    active
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-white hover:text-zinc-950 hover:shadow-sm dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
                  )}
                  href={item.href}
                  onClick={() => {
                    onNavigate?.();
                  }}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-3.5 w-3.5")} />
                  <span
                    className={cn(
                      "truncate whitespace-nowrap transition-[max-width,opacity] duration-200",
                      isCollapsed ? "max-w-0 opacity-0" : "max-w-36 opacity-100",
                    )}
                  >
                    {item.label}
                  </span>
                </PendingLink>
              )}

              {isProjectsItem && projectsExpanded && !isCollapsed ? (
                <div className="ml-4 border-l border-zinc-200 pl-2 dark:border-zinc-800">
                  <ExplorerTree
                    assets={explorer.projects}
                    basePath="/projects"
                    selectedAssetId={selectedProjectId}
                    storageScope={storageScope}
                    selectedTaskId={pathname.startsWith("/tasks/") ? pathname.split("/")[2] ?? null : null}
                    title="Projects"
                    variant="sidebar"
                    onSelect={onNavigate}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function getProjectsVisibilityStorageKey(storageScope: string) {
  return `xmanager:sidebar:${storageScope}:projects-visible`;
}
