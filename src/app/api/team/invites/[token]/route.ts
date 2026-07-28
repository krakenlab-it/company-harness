import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/response";
import { getInvitePublicView } from "@/lib/team/invites";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const invite = getInvitePublicView(token);

  if (!invite) {
    return jsonError("Invite not found", 404);
  }

  return NextResponse.json({ invite });
}
