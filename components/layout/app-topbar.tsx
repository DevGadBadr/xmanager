import Link from "next/link";
import { Bell } from "lucide-react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton } from "@/components/shared/sign-out-button";

export function AppTopbar({
  unreadCount,
  user,
}: {
  unreadCount: number;
  user: {
    name?: string | null;
    image?: string | null;
    email?: string | null;
  };
}) {
  const initials = (user.name ?? user.email ?? "X")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white/92 px-6 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/88">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">x-wrike</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Structured workspace operations and execution control
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          href="/notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
              {unreadCount}
            </span>
          ) : null}
        </Link>
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full">
              <Avatar>
                <AvatarImage alt={user.name ?? "User"} src={user.image ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="pointer-events-none opacity-70">
              {user.email ?? "Signed in"}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <div>
                <SignOutButton className="w-full justify-start px-0" />
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
