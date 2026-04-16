"use client";

import type { MouseEventHandler } from "react";
import { Pencil } from "lucide-react";

type EditIconButtonProps = {
  className?: string;
  label: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export function EditIconButton({ className, label, onClick }: EditIconButtonProps) {
  return (
    <button
      aria-label={label}
      className={
        className ??
        "inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:border-sky-300 hover:text-sky-700 focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-sky-500/30 dark:hover:text-sky-300"
      }
      onClick={onClick}
      type="button"
    >
      <Pencil className="h-4 w-4" />
    </button>
  );
}
