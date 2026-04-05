"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { AppNavigationProvider, useAppNavigation } from "@/components/providers/app-navigation-provider";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function AppShell({
  sidebar,
  topbar,
  children,
}: {
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <AppNavigationProvider>
      <ShellFrame sidebar={sidebar} topbar={topbar}>
        {children}
      </ShellFrame>
    </AppNavigationProvider>
  );
}

function ShellFrame({
  sidebar,
  topbar,
  children,
}: {
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  children: React.ReactNode;
}) {
  const { busyMessage, isBusy } = useAppNavigation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!mobileSidebarOpen) {
      return;
    }

    const closeSidebar = () => {
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", closeSidebar);

    return () => window.removeEventListener("resize", closeSidebar);
  }, [mobileSidebarOpen]);

  const sidebarElement = React.isValidElement(sidebar)
    ? React.cloneElement(sidebar as React.ReactElement<{ mode?: "desktop" | "mobile"; onNavigate?: () => void }>, {
        mode: "desktop",
      })
    : sidebar;
  const mobileSidebarElement = React.isValidElement(sidebar)
    ? React.cloneElement(sidebar as React.ReactElement<{ mode?: "desktop" | "mobile"; onNavigate?: () => void }>, {
        mode: "mobile",
        onNavigate: () => setMobileSidebarOpen(false),
      })
    : sidebar;
  const topbarElement = React.isValidElement(topbar)
    ? React.cloneElement(topbar as React.ReactElement<{ onOpenSidebar?: () => void }>, {
        onOpenSidebar: () => setMobileSidebarOpen(true),
      })
    : topbar;

  return (
    <div className="flex min-h-screen bg-[#eef2f7] dark:bg-[#0d1117]">
      {sidebarElement}
      <div className="flex min-h-screen flex-1 flex-col">
        <div className="relative">
          {topbarElement}
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-x-0 top-full h-1 overflow-hidden transition-opacity duration-200",
              isBusy ? "opacity-100" : "opacity-0",
            )}
          >
            <div className="h-full w-full origin-left animate-[app-shell-progress_1.15s_ease-in-out_infinite] bg-sky-500/70" />
          </div>
        </div>
        <main aria-busy={isBusy} className="relative flex-1 px-4 py-4 sm:px-5 sm:py-5 lg:px-5">
          <div className={cn("transition-opacity duration-200", isBusy && "pointer-events-none opacity-45")}>
            {children}
          </div>
          <div
            aria-live="polite"
            className={cn(
              "pointer-events-none absolute inset-x-4 top-4 z-20 flex justify-end transition duration-200 sm:inset-x-5 sm:top-5 lg:inset-x-5",
              isBusy ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
            )}
          >
            <div className="flex items-center gap-2 rounded-full border border-sky-200 bg-white/96 px-3 py-1.5 text-[11px] font-medium text-sky-700 shadow-sm backdrop-blur dark:border-sky-500/30 dark:bg-zinc-950/92 dark:text-sky-300">
              <LoaderCircle className="h-3 w-3 animate-spin" />
              <span>{busyMessage}</span>
            </div>
          </div>
        </main>
      </div>
      <Dialog onOpenChange={setMobileSidebarOpen} open={mobileSidebarOpen}>
        <DialogContent
          aria-label="Navigation menu"
          aria-describedby={undefined}
          className="left-0 top-0 h-dvh w-[min(21rem,100vw-1rem)] max-w-none translate-x-0 translate-y-0 rounded-none rounded-r-3xl border-l-0 border-t-0 border-zinc-200 bg-[#f7f9fc] p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 lg:hidden"
        >
          <DialogTitle className="sr-only">Navigation menu</DialogTitle>
          {mobileSidebarElement}
        </DialogContent>
      </Dialog>
    </div>
  );
}
