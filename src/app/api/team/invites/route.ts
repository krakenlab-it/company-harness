import { NextResponse } from "next/server";
import { requireAuth, requireRole, AuthError } from "@/lib/auth";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import { store } from "@/lib/store/memory-store";
import { createTeamInviteAsync } from "@/lib/team/invites";
import type {
  InviteMode,
  MemberViewSettings,
  RepoAction,
  TeamMemberRole,
} from "@/lib/types";

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
      mode?: InviteMode;
      role?: TeamMemberRole;
      viewSettings?: Partial<MemberViewSettings>;
      repoActions?: RepoAction[];
      projectIds?: string[];
      invitedById?: string;
      sendEmail?: boolean;
    }>(request);

    if (!body?.email?.trim()) {
      return jsonError("email is required", 400);
    }

    const mode = body.mode ?? "dev";
    const projectIds = body.projectIds ?? [];

    const result = await createTeamInviteAsync({
      email: body.email.trim(),
      name: body.name?.trim(),
      mode,
      role: body.role,
      viewSettings: body.viewSettings,
      repoActions: body.repoActions,
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
