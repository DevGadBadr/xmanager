"use client";

import { useEffect, useState } from "react";
import { PanelLeftOpen, UserRound } from "lucide-react";

import { NotificationMenu } from "@/components/layout/notification-menu";
import { PendingLink } from "@/components/shared/pending-link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { getInitials, resolveAppAssetUrl } from "@/lib/utils";

export function AppTopbar({
  notifications,
  unreadCount,
  user,
  onOpenSidebar,
}: {
  notifications: {
    id: string;
    title: string;
    body: string;
    createdAt: Date;
    readAt: Date | null;
    type: string;
    link: string | null;
  }[];
  unreadCount: number;
  user: {
    fullName?: string | null;
    name?: string | null;
    image?: string | null;
    email?: string | null;
  };
  onOpenSidebar?: () => void;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const updateNow = () => {
      setNow(new Date());
    };

    updateNow();

    const interval = window.setInterval(updateNow, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const displayName = user.fullName?.trim() || user.name?.trim() || user.email?.split("@")[0] || "there";
  const initials = getInitials(displayName, "X");
  const imageSrc = resolveAppAssetUrl(user.image);
  const greetingLead = (() => {
    if (!now) {
      return "Welcome,";
    }

    const hour = now.getHours();
    const period = hour < 5 ? "Evening" : hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
    const useShortGreeting = (now.getDate() + hour) % 3 === 0;

    return `${useShortGreeting ? period : `Good ${period}`},`;
  })();

  return (
    <header className="flex items-center justify-between gap-2.5 border-b border-zinc-200 bg-white/92 px-3 py-2.5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/88 sm:px-4 sm:py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <Button
          aria-label="Open navigation"
          className="h-8 w-8 lg:hidden"
          onClick={onOpenSidebar}
          size="icon"
          type="button"
          variant="outline"
        >
          <PanelLeftOpen className="h-3.5 w-3.5" />
        </Button>
        <p className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-base">
          <span>{greetingLead}</span>
          <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
            {displayName}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <NotificationMenu items={notifications} unreadCount={unreadCount} />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full">
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                <AvatarImage alt={displayName} src={imageSrc} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="pointer-events-none opacity-70">
              {user.email ?? "Signed in"}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <PendingLink busyMessage="Opening your profile..." className="flex w-full items-center gap-2" href="/profile">
                <span className="inline-flex items-center gap-2">
                  <UserRound className="h-4 w-4" />
                  Profile
                </span>
              </PendingLink>
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
