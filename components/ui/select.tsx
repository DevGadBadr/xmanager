import * as React from "react";

import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 shadow-xs outline-none transition focus:border-sky-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100",
      className,
    )}
    {...props}
  />
));

Select.displayName = "Select";
