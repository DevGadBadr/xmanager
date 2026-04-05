import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { markNotificationRead } from "@/modules/notifications/service";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/notifications/read/[notificationId]">,
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { notificationId } = await params;
  const ok = await markNotificationRead(notificationId, session.user.id);

  return NextResponse.json({ ok });
}
