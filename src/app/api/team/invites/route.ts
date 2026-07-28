import { NextResponse } from "next/server";
import { requireAuth, requireRole, AuthError } from "@/lib/auth";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import { store } from "@/lib/store/memory-store";
import { createTeamInviteAsync } from "@/lib/team/invites";
import type { TeamMemberRole } from "@/lib/types";

export async function GET() {
  try {
    const session = await requireAuth();
    requireRole(session, ["admin", "lead"]);
    return NextResponse.json({
      invites: store.listTeamInvites(),
      assignments: store.listProjectAssignments(),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to list invites");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    requireRole(session, ["admin", "lead"]);

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

    const result = await createTeamInviteAsync({
      email: body.email.trim(),
      name: body.name?.trim(),
      role,
      projectIds,
      invitedById: body.invitedById ?? session.memberId,
      sendEmail: body.sendEmail,
    });

    return NextResponse.json({
      invite: result.invite,
      acceptUrl: result.acceptUrl,
      emailSent: result.emailSent,
      emailError: result.emailError,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    const message =
      error instanceof Error ? error.message : "Failed to create invite";
    return jsonError(message, 400);
  }
}
