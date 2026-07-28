import { NextResponse } from "next/server";
import {
  requireAuth,
  getVisibleRepos,
  canManageAccess,
  AuthError,
} from "@/lib/auth";
import { store } from "@/lib/store/memory-store";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import type { RepoAction } from "@/lib/types";

export async function GET() {
  try {
    const session = await requireAuth();
    const repos = getVisibleRepos(session.memberId);
    const matrix = canManageAccess(session)
      ? store.listMembers().map((member) => ({
          member,
          repos: store.listRepos().map((repo) => ({
            repo,
            access: store.getRepoAccess(member.id, repo.id),
          })),
        }))
      : undefined;

    return NextResponse.json({ repos, matrix, session: {
      memberId: session.memberId,
      role: session.role,
      email: session.email,
    } });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to load repo access");
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    if (!canManageAccess(session)) {
      return jsonError("Forbidden", 403);
    }

    const body = await parseJsonBody<{
      memberId?: string;
      repoId?: string;
      actions?: RepoAction[];
    }>(request);

    if (!body?.memberId || !body.repoId || !body.actions) {
      return jsonError("memberId, repoId, and actions are required", 400);
    }

    const access = store.setRepoAccess({
      memberId: body.memberId,
      repoId: body.repoId,
      actions: body.actions,
      grantedBy: session.memberId,
    });

    return NextResponse.json({ access });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to update repo access");
  }
}
