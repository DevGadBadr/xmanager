export const TASK_STATUSES = ["OPEN", "IN_PROGRESS", "CLOSED", "HOLD"] as const;

export type TaskStatusValue = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_OPTIONS: ReadonlyArray<{ value: TaskStatusValue; label: string }> = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "CLOSED", label: "Closed" },
  { value: "HOLD", label: "Hold" },
];

export const TASK_OPEN_STATUSES: readonly TaskStatusValue[] = ["OPEN", "IN_PROGRESS"];

const LEGACY_TASK_STATUS_MAP = {
  TODO: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  IN_REVIEW: "IN_PROGRESS",
  DONE: "CLOSED",
  CANCELLED: "HOLD",
} as const;

export function normalizeTaskStatus(value: string | null | undefined): TaskStatusValue | null {
  if (!value) {
    return null;
  }

  if (TASK_STATUSES.includes(value as TaskStatusValue)) {
    return value as TaskStatusValue;
  }

  return LEGACY_TASK_STATUS_MAP[value as keyof typeof LEGACY_TASK_STATUS_MAP] ?? null;
}

export function formatTaskStatus(status: string) {
  const normalizedStatus = normalizeTaskStatus(status);

  if (normalizedStatus) {
    return TASK_STATUS_OPTIONS.find((option) => option.value === normalizedStatus)?.label ?? normalizedStatus;
  }

  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isOpenTaskStatus(status: string) {
  const normalizedStatus = normalizeTaskStatus(status);

  return normalizedStatus ? TASK_OPEN_STATUSES.includes(normalizedStatus) : false;
}
