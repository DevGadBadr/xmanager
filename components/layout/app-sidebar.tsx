"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Bell,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
} from "lucide-react";

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
  mode = "desktop",
  onNavigate,
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
    }>;
  };
  mode?: "desktop" | "mobile";
  onNavigate?: () => void;
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
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  return (
    <aside
      className={cn(
        "flex flex-col text-zinc-900 dark:text-zinc-50",
        isMobile
          ? "h-full bg-[#f7f9fc] px-3 py-4 dark:bg-zinc-950"
          : "hidden h-screen w-64 shrink-0 border-r border-zinc-200 bg-[#f7f9fc] px-3 py-4 dark:border-zinc-800 dark:bg-zinc-950 lg:flex",
      )}
    >
      <div
        aria-label={workspaceName}
        className="mb-5 rounded-2xl border border-zinc-200 bg-white px-3.5 py-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-[0.08em] text-zinc-950 dark:text-zinc-50">XManager</h1>
            {isMobile ? (
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                {workspaceName}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
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
                      "flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2 pr-11 text-[14.3px] font-medium transition leading-tight",
                      active
                        ? "bg-sky-600 text-white shadow-sm"
                        : "text-zinc-600 hover:bg-white hover:text-zinc-950 hover:shadow-sm dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
                    )}
                    href={item.href}
                    onClick={() => {
                      onNavigate?.();
                    }}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </PendingLink>

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
                </div>
              ) : (
                <PendingLink
                  busyMessage={`Opening ${item.label.toLowerCase()}...`}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[14.3px] font-medium transition leading-tight",
                    active
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-white hover:text-zinc-950 hover:shadow-sm dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
                  )}
                  href={item.href}
                  onClick={() => {
                    onNavigate?.();
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </PendingLink>
              )}

              {isProjectsItem && projectsExpanded ? (
                <div className="ml-4 border-l border-zinc-200 pl-2 dark:border-zinc-800">
                  <ExplorerTree
                    assets={explorer.projects}
                    basePath="/projects"
                    selectedAssetId={selectedProjectId}
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
