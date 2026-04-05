"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DeleteIconButton({
  label,
  pending = false,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "children" | "size" | "variant"> & {
  label: string;
  pending?: boolean;
}) {
  return (
    <Button
      aria-label={label}
      className={cn(
        "h-8 w-8 rounded-full border border-red-200 bg-red-50 p-0 text-red-600 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20",
        className,
      )}
      disabled={pending || props.disabled}
      size="icon"
      title={label}
      type="submit"
      variant="ghost"
      {...props}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
