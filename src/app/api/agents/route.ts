import { NextResponse } from "next/server";
import {
  requireAuth,
  requireRole,
  requireRepoAccess,
  memberCanDelegate,
  AuthError,
} from "@/lib/auth";
import { blockHermesDelegation } from "@/lib/auth/api";
import {
  delegateToCursor,
  syncRunningAgentJobs,
} from "@/lib/cursor/client";
import { store } from "@/lib/store/memory-store";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import type { CursorAgentJobType } from "@/lib/types";

function mapJob(job: ReturnType<typeof store.getAgentJob>) {
  if (!job) return job;
  return {
    ...job,
    url: job.prUrl,
    actor: job.actorId ? store.getMember(job.actorId) : undefined,
  };
}

export async function GET() {
  try {
    const session = await requireAuth();
    await syncRunningAgentJobs();
    const agents = store.listAgentJobs().map((job) => mapJob(job));
    const audits = store.listDelegationAudits(20);
    return NextResponse.json({
      agents,
      jobs: agents,
      audits,
      canDelegate: memberCanDelegate(session) && session.role !== "viewer",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to list agent jobs");
  }
}

export async function POST(request: Request) {
  try {
    blockHermesDelegation(request);
    const session = await requireAuth();
    requireRole(session, ["admin", "lead"]);

    const body = await parseJsonBody<{
      type?: string;
      title?: string;
      prompt?: string;
      repo?: string;
    }>(request);

    if (!body?.title?.trim()) {
      return jsonError("title is required", 400);
    }
    if (!body.prompt?.trim()) {
      return jsonError("prompt is required", 400);
    }
    if (!body.repo?.trim()) {
      return jsonError("repo is required", 400);
    }

    requireRepoAccess(session, body.repo.trim(), "agents");

    const validTypes: CursorAgentJobType[] = [
      "issue",
      "pr",
      "feature",
      "bugfix",
      "refactor",
      "merge_conflict",
    ];
    const type = validTypes.includes(body.type as CursorAgentJobType)
      ? (body.type as CursorAgentJobType)
      : "feature";

    const job = await delegateToCursor({
      type,
      title: body.title.trim(),
      prompt: body.prompt.trim(),
      repo: body.repo.trim(),
      actorId: session.memberId,
      source: "agents_ui",
    });

    return NextResponse.json(
      { job: mapJob(job), agent: mapJob(job) },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to delegate to Cursor agent");
  }
}
