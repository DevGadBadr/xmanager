"use client";

import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function WorkspaceFilterBar({
  search,
  activeFilterLabel,
  onSearchChange,
  onClearFilter,
}: {
  search: string;
  activeFilterLabel: string | null;
  onSearchChange: (value: string) => void;
  onClearFilter: () => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="space-y-3 lg:flex lg:items-end lg:justify-between lg:gap-3 lg:space-y-0">
        <label className="block lg:flex lg:items-center lg:gap-3">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400 lg:mb-0 lg:shrink-0">
            Search tasks
          </span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              className="pl-9 lg:min-w-[24rem] xl:min-w-[30rem]"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by task name or description"
              value={search}
            />
          </span>
        </label>

        {activeFilterLabel ? (
          <div className="flex min-h-8 items-center justify-between gap-3 lg:flex-none">
            <div className="flex min-h-8 items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                Quick filter
              </span>
              <Badge className="px-2.5 py-1 text-[10px]" variant="default">
                {activeFilterLabel}
              </Badge>
            </div>

            <Button className="h-8 px-2.5 text-xs" onClick={onClearFilter} type="button" variant="ghost">
              Clear
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
