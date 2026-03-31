import type { Role } from "@prisma/client";

export type Permission =
  | "invites:create"
  | "users:manage"
  | "teams:manage"
  | "projects:create"
  | "projects:manage"
  | "tasks:create"
  | "tasks:assign"
  | "tasks:manage"
  | "notifications:view";

const permissionMap: Record<Role, Permission[]> = {
  OWNER: [
    "invites:create",
    "users:manage",
    "teams:manage",
    "projects:create",
    "projects:manage",
    "tasks:create",
    "tasks:assign",
    "tasks:manage",
    "notifications:view",
  ],
  ADMIN: [
    "invites:create",
    "users:manage",
    "teams:manage",
    "projects:create",
    "projects:manage",
    "tasks:create",
    "tasks:assign",
    "tasks:manage",
    "notifications:view",
  ],
  TEAM_MANAGER: [
    "projects:create",
    "projects:manage",
    "tasks:create",
    "tasks:assign",
    "tasks:manage",
    "notifications:view",
  ],
  MEMBER: ["tasks:create", "notifications:view"],
};

export function can(role: Role, permission: Permission) {
  return permissionMap[role].includes(permission);
}

export function assertPermission(role: Role, permission: Permission) {
  if (!can(role, permission)) {
    throw new Error("You do not have permission to perform this action.");
  }
}
