"use client";

import Image from "next/image";

import { ensureAppPath } from "@/lib/auth-path";
import { cn } from "@/lib/utils";

export function AppLogo({
  className,
  imageClassName,
  priority = false,
}: {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("flex items-center", className)}>
      <Image
        alt="Flow logo"
        className={cn("h-8 w-auto invert dark:invert-0", imageClassName)}
        height={30}
        priority={priority}
        src={ensureAppPath("/flowlogo.svg")}
        width={94}
      />
    </div>
  );
}
