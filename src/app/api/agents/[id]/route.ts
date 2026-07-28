import { NextRequest, NextResponse } from "next/server";
import { updateAgentJobStatus } from "@/lib/cursor/client";
import { store } from "@/lib/store/memory-store";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import type { CursorAgentJobStatus } from "@/lib/types";

const VALID_STATUSES: CursorAgentJobStatus[] = [
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = store.getAgentJob(id);

    if (!existing) {
      return jsonError("Agent job not found", 404);
    }

    const body = await parseJsonBody<{
      status?: CursorAgentJobStatus;
      prUrl?: string;
      resultSummary?: string;
      cursorAgentId?: string;
    }>(request);

    if (!body?.status) {
      return jsonError("status is required", 400);
    }

    if (!VALID_STATUSES.includes(body.status)) {
      return jsonError("Invalid status", 400);
    }

    const job = updateAgentJobStatus(id, body.status, {
      prUrl: body.prUrl,
      resultSummary: body.resultSummary,
      cursorAgentId: body.cursorAgentId,
    });

    if (!job) {
      return jsonError("Failed to update agent job");
    }

    store.addActivity({
      entityType: "agent",
      entityId: job.id,
      action: "status_changed",
      summary: `Agent job "${job.title}" is now ${body.status}`,
    });

    return NextResponse.json({
      job: { ...job, url: job.prUrl },
      agent: { ...job, url: job.prUrl },
    });
  } catch {
    return jsonError("Failed to update agent job");
  }
}
