import { NextResponse } from "next/server";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import { acceptTeamInvite } from "@/lib/team/invites";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const body = await parseJsonBody<{ name?: string }>(request);

  let authUserId: string | undefined;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      authUserId = data.user?.id;
    }
  }

  try {
    const result = acceptTeamInvite({
      token,
      name: body?.name,
      authUserId,
    });

    return NextResponse.json({
      member: result.member,
      invite: result.invite,
      redirectTo: "/",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to accept invite";
    return jsonError(message, 400);
  }
}
