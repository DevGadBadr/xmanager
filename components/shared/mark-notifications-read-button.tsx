"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { ensureAppPath } from "@/lib/auth-path";
import { Button } from "@/components/ui/button";

export function MarkNotificationsReadButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      onClick={() =>
        startTransition(async () => {
          await fetch(ensureAppPath("/api/notifications/read"), { method: "POST" });
          router.refresh();
        })
      }
      type="button"
      variant="outline"
    >
      {pending ? "Updating..." : "Mark all read"}
    </Button>
  );
}
