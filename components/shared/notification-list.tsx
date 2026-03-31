import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  readAt: Date | null;
  type: string;
  link: string | null;
};

export function NotificationList({ items }: { items: NotificationItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification feed</CardTitle>
      </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <Link
              className="block rounded-xl border border-zinc-200 p-4 transition hover:border-indigo-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-indigo-500/40 dark:hover:bg-zinc-800/60"
              href={item.link ?? "/notifications"}
              key={item.id}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-zinc-950 dark:text-zinc-50">{item.title}</p>
                {!item.readAt ? <Badge variant="default">Unread</Badge> : <Badge variant="neutral">Read</Badge>}
              </div>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{item.body}</p>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })} • {item.type}
              </p>
            </Link>
          ))}
        </CardContent>
      </Card>
  );
}
