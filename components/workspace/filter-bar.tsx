"use client";

import { startTransition, useDeferredValue, useEffect, useEffectEvent, useState } from "react";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AssigneeOption = {
  id: string;
  label: string;
};

export function WorkspaceFilterBar({
  assignees,
  initialSearch,
  initialAssigneeId,
}: {
  assignees: AssigneeOption[];
  initialSearch?: string;
  initialAssigneeId?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch ?? "");
  const [assigneeId, setAssigneeId] = useState(initialAssigneeId ?? "");
  const deferredSearch = useDeferredValue(search);

  const syncFilters = useEffectEvent((nextSearch: string, nextAssigneeId: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextSearch.trim()) {
      params.set("q", nextSearch.trim());
    } else {
      params.delete("q");
    }

    if (nextAssigneeId) {
      params.set("assignee", nextAssigneeId);
    } else {
      params.delete("assignee");
    }

    params.delete("task");

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();

    if (nextQuery === currentQuery) {
      return;
    }

    startTransition(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    });
  });

  useEffect(() => {
    syncFilters(deferredSearch, assigneeId);
  }, [assigneeId, deferredSearch]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <label className="relative block w-full xl:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            className="pl-9"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks, descriptions, or keywords"
            value={search}
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <Button
            className={cn(
              "rounded-full px-4",
              !assigneeId && "bg-sky-600 hover:bg-sky-500",
            )}
            onClick={() => setAssigneeId("")}
            size="sm"
            type="button"
            variant={!assigneeId ? "default" : "secondary"}
          >
            All assignees
          </Button>
          {assignees.map((assignee) => (
            <Button
              className={cn(
                "rounded-full px-4",
                assigneeId === assignee.id && "bg-sky-600 hover:bg-sky-500",
              )}
              key={assignee.id}
              onClick={() => setAssigneeId(assignee.id)}
              size="sm"
              type="button"
              variant={assigneeId === assignee.id ? "default" : "secondary"}
            >
              {assignee.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
