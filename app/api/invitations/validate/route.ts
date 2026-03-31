import { NextResponse } from "next/server";

import { getInvitationByToken } from "@/modules/invitations/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ valid: false, reason: "Missing token" }, { status: 400 });
  }

  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return NextResponse.json({ valid: false, reason: "Invite not found" }, { status: 404 });
  }

  return NextResponse.json({
    valid: invitation.status === "PENDING",
    email: invitation.email,
    workspaceName: invitation.workspace.name,
    status: invitation.status,
  });
}
