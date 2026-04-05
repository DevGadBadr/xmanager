"use client";

import { KanbanSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PendingLink } from "@/components/shared/pending-link";
import { cn } from "@/lib/utils";

type AssetNode = {
  id: string;
  name: string;
  key?: string;
  status?: string;
  taskCount?: number;
  openTaskCount?: number;
};

export function ExplorerTree({
  title,
  basePath,
  assets,
  selectedAssetId,
  variant = "panel",
  onSelect,
}: {
  title: string;
  basePath: string;
  assets: AssetNode[];
  selectedAssetId?: string | null;
  variant?: "panel" | "sidebar";
  onSelect?: () => void;
}) {
  const isSidebar = variant === "sidebar";

  return (
    <div className={cn("space-y-4", isSidebar && "space-y-1.5")}>
      {isSidebar ? (
        <div className="flex items-center justify-between gap-2 px-2 pt-0.5">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
            {assets.length} items
          </span>
        </div>
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
          <PendingLink
            busyMessage="Loading project..."
            className={cn(
              "flex items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-[14.3px] transition leading-tight",
              selectedAssetId === asset.id
                ? "border-sky-200 bg-sky-50 text-zinc-950 shadow-sm dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-zinc-50"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
            )}
            href={`${basePath}/${asset.id}`}
            key={asset.id}
            onClick={onSelect}
          >
            <KanbanSquare
              className={cn(
                "h-4 w-4 shrink-0",
                selectedAssetId === asset.id && "text-sky-700 dark:text-sky-300",
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{asset.name}</p>
              <p
                className={cn(
                  "truncate text-[11px] uppercase tracking-[0.2em] opacity-70",
                  selectedAssetId === asset.id && "text-zinc-600 opacity-100 dark:text-zinc-300",
                )}
              >
                {asset.key}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full bg-black/8 px-2 py-1 text-[11px] font-medium dark:bg-white/10",
                selectedAssetId === asset.id &&
                  "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200",
              )}
            >
              {asset.openTaskCount ?? asset.taskCount ?? 0}
            </span>
          </PendingLink>
        ))}
      </div>
    </div>
  );
}
