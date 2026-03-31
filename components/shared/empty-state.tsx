import { Inbox } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="rounded-full bg-indigo-100 p-3 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
          <Inbox className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-medium text-zinc-950 dark:text-zinc-50">{title}</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
