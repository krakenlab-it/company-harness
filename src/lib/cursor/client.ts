import type { CursorAgentJob, CursorAgentJobStatus } from "@/lib/types";
import { store } from "@/lib/store/memory-store";
import { hashPrompt, wrapDelegationPrompt } from "@/lib/cursor/prompts";
import { mapCursorStatusToJobStatus } from "@/lib/cursor/status";

// Cursor Cloud Agent API v0 — https://cursor.com/docs/cloud-agent/api/v0

const CURSOR_API_BASE = "https://api.cursor.com/v0";

export interface DelegateToCursorInput {
  type: CursorAgentJob["type"];
  title: string;
  prompt: string;
  repo?: string;
  actorId?: string;
  source?: "hermes" | "agents_ui" | "api";
  ref?: string;
}

export interface CursorAgentApiResponse {
  id?: string;
  name?: string;
  status?: string;
  summary?: string;
  source?: { repository?: string; ref?: string };
  target?: {
    branchName?: string;
    url?: string;
    prUrl?: string;
    pull_request_url?: string;
  };
}

function cursorAuthHeader(apiKey: string): string {
  const encoded = Buffer.from(`${apiKey}:`).toString("base64");
  return `Basic ${encoded}`;
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
  extras?: Partial<
    Pick<CursorAgentJob, "cursorAgentId" | "prUrl" | "resultSummary">
  >,
): CursorAgentJob | undefined {
  return store.updateAgentJob(id, { status, ...extras });
}

async function cursorFetch(
  path: string,
  init?: RequestInit,
): Promise<Response | null> {
  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey) return null;

  try {
    return await fetch(`${CURSOR_API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: cursorAuthHeader(apiKey),
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch (error) {
    console.warn("[cursor] API request failed:", error);
    return null;
  }
}

export async function fetchCursorAgentStatus(
  cursorAgentId: string,
): Promise<CursorAgentApiResponse | null> {
  const response = await cursorFetch(`/agents/${encodeURIComponent(cursorAgentId)}`);
  if (!response?.ok) {
    if (response) {
      console.warn(
        `[cursor] status ${response.status}: ${await response.text()}`,
      );
    }
    return null;
  }
  return (await response.json()) as CursorAgentApiResponse;
}

export async function syncAgentJobFromCursor(
  job: CursorAgentJob,
): Promise<CursorAgentJob> {
  if (!job.cursorAgentId || !isCursorConfigured()) {
    return job;
  }

  if (job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
    return job;
  }

  const remote = await fetchCursorAgentStatus(job.cursorAgentId);
  if (!remote?.status) return job;

  const status = mapCursorStatusToJobStatus(remote.status);
  const prUrl =
    remote.target?.prUrl ??
    remote.target?.pull_request_url ??
    job.prUrl;

  const updated = store.updateAgentJob(job.id, {
    status,
    prUrl,
    resultSummary: remote.summary ?? job.resultSummary,
  });

  if (updated && job.actorId && job.repo) {
    const audits = store.listDelegationAudits(100);
    const audit = audits.find((a) => a.jobId === job.id);
    if (audit) {
      store.updateDelegationAudit(audit.id, {
        status,
        prUrl,
      });
    }
  }

  if (updated && (status === "completed" || status === "failed")) {
    store.addActivity({
      entityType: "agent",
      entityId: job.id,
      action: status === "completed" ? "completed" : "failed",
      summary: `Cursor agent ${status}: ${job.title}`,
      actorId: job.actorId,
    });
  }

  return updated ?? job;
}

export async function syncRunningAgentJobs(): Promise<number> {
  const running = store
    .listAgentJobs()
    .filter(
      (j) =>
        (j.status === "running" || j.status === "queued") && j.cursorAgentId,
    );

  let synced = 0;
  for (const job of running) {
    const before = job.status;
    const after = await syncAgentJobFromCursor(job);
    if (after.status !== before) synced += 1;
  }
  return synced;
}

async function postToCursorApi(
  input: DelegateToCursorInput,
): Promise<{ cursorAgentId?: string; prUrl?: string; status?: string } | null> {
  if (!input.repo?.trim()) return null;

  const response = await cursorFetch("/agents", {
    method: "POST",
    body: JSON.stringify({
      prompt: { text: input.prompt },
      source: {
        repository: input.repo.trim(),
        ref: input.ref ?? "main",
      },
      target: {
        autoCreatePr: true,
      },
    }),
  });

  if (!response) return null;

  if (!response.ok) {
    console.warn(
      `[cursor] launch ${response.status}: ${await response.text()}`,
    );
    return null;
  }

  const data = (await response.json()) as CursorAgentApiResponse;

  return {
    cursorAgentId: data.id,
    prUrl: data.target?.prUrl ?? data.target?.pull_request_url,
    status: data.status,
  };
}

export async function delegateToCursor(
  input: DelegateToCursorInput,
): Promise<CursorAgentJob> {
  const wrappedPrompt = wrapDelegationPrompt(input.type, input.prompt);

  const job = store.createAgentJob({
    type: input.type,
    title: input.title,
    prompt: wrappedPrompt,
    repo: input.repo,
    actorId: input.actorId,
    status: "queued",
  });

  store.addActivity({
    entityType: "agent",
    entityId: job.id,
    action: "delegated",
    summary:
      input.source === "hermes"
        ? `Hermes @cursor: ${input.title}`
        : `Delegated to Cursor: ${input.title}`,
    actorId: input.actorId,
  });

  if (input.actorId && input.repo) {
    store.createDelegationAudit({
      jobId: job.id,
      actorId: input.actorId,
      repoUrl: input.repo,
      type: input.type,
      promptHash: hashPrompt(wrappedPrompt),
      status: job.status,
      prUrl: job.prUrl,
    });
  }

  if (!isCursorConfigured()) {
    store.updateAgentJob(job.id, {
      status: "running",
      resultSummary:
        "Simulated — CURSOR_API_KEY not configured. Job queued locally.",
    });
    return store.getAgentJob(job.id)!;
  }

  const apiResult = await postToCursorApi({ ...input, prompt: wrappedPrompt });

  if (apiResult?.cursorAgentId) {
    const status = apiResult.status
      ? mapCursorStatusToJobStatus(apiResult.status)
      : "running";
    const updated = store.updateAgentJob(job.id, {
      status,
      cursorAgentId: apiResult.cursorAgentId,
      prUrl: apiResult.prUrl,
    });
    return updated!;
  }

  const updated = store.updateAgentJob(job.id, {
    status: "running",
    resultSummary:
      "Queued locally — Cursor API unavailable. Check CURSOR_API_KEY and repo access.",
  });
  return updated!;
}
