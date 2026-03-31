import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { markNotificationsRead } from "@/modules/notifications/service";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await markNotificationsRead(session.user.id);

  return NextResponse.json({ ok: true });
}
