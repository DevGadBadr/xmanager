"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmVariant = "destructive",
  pending = false,
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: React.ComponentProps<typeof Button>["variant"];
  pending?: boolean;
  onConfirm: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md border-zinc-200/90 bg-white/95 p-0 shadow-xl backdrop-blur dark:border-zinc-800/90 dark:bg-zinc-900/95">
        <div className="border-b border-zinc-200/80 px-5 py-4 dark:border-zinc-800/80">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="mt-1 leading-6">{description}</DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
          <Button disabled={pending} onClick={() => onOpenChange(false)} type="button" variant="outline">
            {cancelLabel}
          </Button>
          <Button disabled={pending} onClick={onConfirm} type="button" variant={confirmVariant}>
            {pending ? "Working..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
