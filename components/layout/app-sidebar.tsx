"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
} from "lucide-react";

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
}: {
  workspaceName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-zinc-200 bg-[#f7f9fc] px-4 py-5 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mb-6 rounded-2xl border border-zinc-200 bg-white px-4 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-600">Workspace</p>
        <h1 className="mt-2 text-xl font-semibold">{workspaceName}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">x-wrike control center</p>
      </div>

      <nav className="space-y-1.5">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-white hover:text-zinc-950 hover:shadow-sm dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">Structured delivery workspace</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          Hierarchies, project control views, assignments, activity, and invite-only onboarding are all available from one shell.
        </p>
      </div>
    </aside>
  );
}
