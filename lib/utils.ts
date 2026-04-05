import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { ensureAppPath } from "@/lib/auth-path";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "Not set";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function getInitials(value?: string | null, fallback = "X") {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return fallback;
  }

  return normalizedValue
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function resolveAppAssetUrl(value?: string | null) {
  if (!value) {
    return undefined;
  }

  return value.startsWith("/") ? ensureAppPath(value) : value;
}
