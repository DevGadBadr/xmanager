import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

export function Avatar({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      className={cn("relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  );
}

export function AvatarImage(
  props: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>,
) {
  return <AvatarPrimitive.Image className="aspect-square h-full w-full" {...props} />;
}

export function AvatarFallback({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-sky-100 text-xs font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
        className,
      )}
      {...props}
    />
  );
}
