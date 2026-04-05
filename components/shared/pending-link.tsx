"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { useAppNavigation } from "@/components/providers/app-navigation-provider";

type PendingLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
  busyMessage?: string;
  href: string;
};

export function PendingLink({
  busyMessage,
  href,
  onClick,
  onNavigate,
  target,
  ...props
}: PendingLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { startNavigation } = useAppNavigation();
  const query = searchParams.toString();
  const currentHref = query ? `${pathname}?${query}` : pathname;

  return (
    <Link
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event);

        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          target === "_blank" ||
          href === currentHref
        ) {
          return;
        }
      }}
      onNavigate={(event) => {
        onNavigate?.(event);

        if (event.defaultPrevented || href === currentHref) {
          return;
        }

        startNavigation(href, busyMessage);
      }}
      target={target}
    />
  );
}
