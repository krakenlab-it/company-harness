import { NextResponse } from "next/server";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import { store } from "@/lib/store/memory-store";
import { createTeamInviteAsync } from "@/lib/team/invites";
import type { TeamMemberRole } from "@/lib/types";

export async function GET() {
  return NextResponse.json({
    invites: store.listTeamInvites(),
    assignments: store.listProjectAssignments(),
  });
}

export async function POST(request: Request) {
  const body = await parseJsonBody<{
    email?: string;
    name?: string;
    role?: TeamMemberRole;
    projectIds?: string[];
    invitedById?: string;
    sendEmail?: boolean;
  }>(request);

  if (!body?.email?.trim()) {
    return jsonError("email is required", 400);
  }

  const role = body.role ?? "dev";
  const projectIds = body.projectIds ?? [];

  try {
    const result = await createTeamInviteAsync({
      email: body.email.trim(),
      name: body.name?.trim(),
      role,
      projectIds,
      invitedById: body.invitedById,
      sendEmail: body.sendEmail,
    });

    return NextResponse.json({
      invite: result.invite,
      acceptUrl: result.acceptUrl,
      emailSent: result.emailSent,
      emailError: result.emailError,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create invite";
    return jsonError(message, 400);
  }
}
