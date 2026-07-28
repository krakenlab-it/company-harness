import type { CursorAgentJob, CursorAgentJobStatus } from "@/lib/types";
import { store } from "@/lib/store/memory-store";

// Cursor Cloud Agent API endpoints may vary by version.
// This client targets https://api.cursor.com/v0/agents with graceful local fallback.

const CURSOR_API_BASE = "https://api.cursor.com/v0";

export interface DelegateToCursorInput {
  type: CursorAgentJob["type"];
  title: string;
  prompt: string;
  repo?: string;
}

export function isCursorConfigured(): boolean {
  return Boolean(process.env.CURSOR_API_KEY);
}

export function listAgentJobs(): CursorAgentJob[] {
  return store.listAgentJobs();
}

export function updateAgentJobStatus(
  id: string,
  status: CursorAgentJobStatus,
  extras?: Partial<Pick<CursorAgentJob, "cursorAgentId" | "prUrl" | "resultSummary">>,
): CursorAgentJob | undefined {
  return store.updateAgentJob(id, { status, ...extras });
}

async function postToCursorApi(
  input: DelegateToCursorInput,
): Promise<{ cursorAgentId?: string; prUrl?: string } | null> {
  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(`${CURSOR_API_BASE}/agents`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: input.type,
        title: input.title,
        prompt: input.prompt,
        repository: input.repo,
      }),
    });

    if (!response.ok) {
      console.warn(
        `[cursor] API returned ${response.status}: ${await response.text()}`,
      );
      return null;
    }

    const data = (await response.json()) as {
      id?: string;
      agent_id?: string;
      pr_url?: string;
      pull_request_url?: string;
    };

    return {
      cursorAgentId: data.id ?? data.agent_id,
      prUrl: data.pr_url ?? data.pull_request_url,
    };
  } catch (error) {
    console.warn("[cursor] API request failed, falling back to local queue:", error);
    return null;
  }
}

export async function delegateToCursor(
  input: DelegateToCursorInput,
): Promise<CursorAgentJob> {
  const job = store.createAgentJob({
    type: input.type,
    title: input.title,
    prompt: input.prompt,
    repo: input.repo,
    status: "queued",
  });

  store.addActivity({
    entityType: "agent",
    entityId: job.id,
    action: "delegated",
    summary: `Delegated to Cursor: ${input.title}`,
  });

  if (!isCursorConfigured()) {
    store.updateAgentJob(job.id, {
      status: "running",
      resultSummary: "Simulated — CURSOR_API_KEY not configured. Job queued locally.",
    });
    return store.getAgentJob(job.id)!;
  }

  const apiResult = await postToCursorApi(input);

  if (apiResult) {
    const updated = store.updateAgentJob(job.id, {
      status: "running",
      cursorAgentId: apiResult.cursorAgentId,
      prUrl: apiResult.prUrl,
    });
    return updated!;
  }

  const updated = store.updateAgentJob(job.id, {
    status: "running",
    resultSummary: "Queued locally — Cursor API unavailable. Will retry when configured.",
  });
  return updated!;
}
