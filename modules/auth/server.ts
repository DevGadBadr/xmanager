import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect("/");
  }

  return user;
}

export async function getCurrentMembership() {
  const user = await getCurrentUser();

  if (!user?.id) {
    return null;
  }

  return db.membership.findFirst({
    where: {
      userId: user.id,
      isArchived: false,
      status: "ACTIVE",
      workspace: {
        isArchived: false,
      },
    },
    include: {
      user: true,
      workspace: true,
      teamLinks: {
        include: {
          team: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function requireCurrentMembership() {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/");
  }

  return membership;
}
