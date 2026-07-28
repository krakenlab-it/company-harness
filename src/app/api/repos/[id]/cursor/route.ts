import { NextResponse } from "next/server";
import {
  requireAuth,
  requireRole,
  requireRepoAccess,
  AuthError,
} from "@/lib/auth";
import { blockHermesDelegation } from "@/lib/auth/api";
import { delegateToCursor } from "@/lib/cursor/client";
import { store } from "@/lib/store/memory-store";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import type { CursorAgentJobType } from "@/lib/types";

const VALID_TYPES: CursorAgentJobType[] = [
  "issue",
  "pr",
  "feature",
  "bugfix",
  "refactor",
  "merge_conflict",
];

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    blockHermesDelegation(request);
    const session = await requireAuth();
    requireRole(session, ["admin", "lead"]);

    const { id } = await context.params;
    const repo = store.getRepo(id);
    if (!repo) return jsonError("Repo not found", 404);

    requireRepoAccess(session, repo.url, "agents");

    const body = await parseJsonBody<{
      type?: string;
      title?: string;
      prompt?: string;
    }>(request);

    if (!body?.title?.trim()) {
      return jsonError("title is required", 400);
    }
    if (!body.prompt?.trim()) {
      return jsonError("prompt is required", 400);
    }

    const type = VALID_TYPES.includes(body.type as CursorAgentJobType)
      ? (body.type as CursorAgentJobType)
      : "feature";

    const job = await delegateToCursor({
      type,
      title: body.title.trim(),
      prompt: body.prompt.trim(),
      repo: repo.url,
      actorId: session.memberId,
      source: "agents_ui",
    });

    store.addActivity({
      entityType: "hermes",
      entityId: job.id,
      action: "cursor_delegated",
      summary: `Repo activity → ${body.title.trim().slice(0, 80)}`,
      actorId: session.memberId,
    });

    return NextResponse.json({ job, agent: job }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to delegate to Cursor");
  }
}
