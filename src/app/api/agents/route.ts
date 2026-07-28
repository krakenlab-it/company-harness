import { NextRequest, NextResponse } from "next/server";
import { delegateToCursor } from "@/lib/cursor/client";
import { store } from "@/lib/store/memory-store";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import type { CursorAgentJobType } from "@/lib/types";

function mapJob(job: ReturnType<typeof store.getAgentJob>) {
  if (!job) return job;
  return {
    ...job,
    url: job.prUrl,
  };
}

export async function GET() {
  try {
    const agents = store.listAgentJobs().map((job) => ({
      ...job,
      url: job.prUrl,
    }));
    return NextResponse.json({ agents, jobs: agents });
  } catch {
    return jsonError("Failed to list agent jobs");
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const validTypes: CursorAgentJobType[] = [
      "issue",
      "pr",
      "feature",
      "bugfix",
      "refactor",
    ];
    const type = validTypes.includes(body.type as CursorAgentJobType)
      ? (body.type as CursorAgentJobType)
      : "feature";

    const job = await delegateToCursor({
      type,
      title: body.title.trim(),
      prompt: body.prompt.trim(),
      repo: body.repo?.trim(),
    });

    return NextResponse.json(
      { job: mapJob(job), agent: mapJob(job) },
      { status: 201 },
    );
  } catch {
    return jsonError("Failed to delegate to Cursor agent");
  }
}
