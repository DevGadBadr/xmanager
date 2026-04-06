"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAppNavigation } from "@/components/providers/app-navigation-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ensureAppPath } from "@/lib/auth-path";

type NotificationMenuItem = {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  readAt: Date | null;
  type: string;
  link: string | null;
};

export function NotificationMenu({
  items,
  unreadCount,
}: {
  items: NotificationMenuItem[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { startNavigation } = useAppNavigation();

  const handleOpenItem = (item: NotificationMenuItem) => {
    setOpen(false);

    void fetch(ensureAppPath(`/api/notifications/read/${item.id}`), {
      method: "POST",
      keepalive: true,
    }).catch(() => undefined);

    if (item.link) {
      startNavigation(item.link, "Opening notification...");
      router.push(item.link);
      return;
    }

    router.refresh();
  };

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Toggle notifications"
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          type="button"
        >
          <Bell className="h-3 w-3" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white">
              {unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(24rem,calc(100vw-1rem))] p-0">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Notifications</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
          </div>
        </div>
        <div className="max-h-[28rem] overflow-y-auto p-2">
          {items.length === 0 ? (
            <div className="rounded-xl px-3 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No notifications yet.
            </div>
          ) : (
            items.map((item) => (
              <button
                className="flex w-full flex-col rounded-xl px-3 py-3 text-left transition hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none dark:hover:bg-zinc-800/70 dark:focus-visible:bg-zinc-800/70"
                key={item.id}
                onClick={() => handleOpenItem(item)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {item.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                      {item.body}
                    </p>
                  </div>
                  {!item.readAt ? <Badge variant="default">Unread</Badge> : null}
                </div>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })} • {item.type}
                </p>
              </button>
            ))
          )}
        </div>
        <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
          <Button
            className="w-full justify-center"
            onClick={() => {
              setOpen(false);
              router.push("/notifications");
            }}
            type="button"
            variant="ghost"
          >
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
