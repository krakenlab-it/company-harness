import type { TriggerJobRun } from "@/lib/types";

const TRIGGER_API_BASE = "https://api.trigger.dev/api/v1";

interface TriggerRunRow {
  id: string;
  taskIdentifier?: string;
  status?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
}

interface TriggerRunsResponse {
  data?: TriggerRunRow[];
  runs?: TriggerRunRow[];
  error?: string;
}

/** Estimated cost per run minute (adjust via TRIGGER_COST_PER_MINUTE_USD) */
function estimateRunCost(durationMs?: number): number {
  const perMinute = Number(process.env.TRIGGER_COST_PER_MINUTE_USD ?? "0.002");
  if (!durationMs) return 0;
  return (durationMs / 60_000) * perMinute;
}

export async function fetchTriggerRuns(limit = 25): Promise<{
  runs: Omit<TriggerJobRun, "id">[];
  totalEstimatedSpendUsd: number;
}> {
  const secretKey = process.env.TRIGGER_SECRET_KEY;
  if (!secretKey) {
    throw new Error("TRIGGER_SECRET_KEY is not configured");
  }

  const url = new URL(`${TRIGGER_API_BASE}/runs`);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Trigger.dev API error (${res.status}): ${text.slice(0, 200)}`);
  }

  const body = (await res.json()) as TriggerRunsResponse;
  const rows = body.data ?? body.runs ?? [];

  let totalEstimatedSpendUsd = 0;
  const runs = rows.map((row) => {
    const costUsd = estimateRunCost(row.durationMs);
    totalEstimatedSpendUsd += costUsd;
    return {
      externalRunId: row.id,
      taskId: row.taskIdentifier ?? "unknown",
      status: row.status ?? "unknown",
      durationMs: row.durationMs,
      costUsd,
      startedAt: row.startedAt ?? new Date().toISOString(),
      finishedAt: row.finishedAt,
    };
  });

  return { runs, totalEstimatedSpendUsd };
}

export async function fetchTriggerEnvironmentSummary(): Promise<{
  environmentCount: number;
  sessionHint: string;
}> {
  const secretKey = process.env.TRIGGER_SECRET_KEY;
  if (!secretKey) {
    throw new Error("TRIGGER_SECRET_KEY is not configured");
  }

  const res = await fetch(`${TRIGGER_API_BASE}/environments`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });

  if (!res.ok) {
    return {
      environmentCount: 0,
      sessionHint: "Could not list environments — runs sync still available",
    };
  }

  const body = (await res.json()) as { data?: unknown[]; environments?: unknown[] };
  const envs = body.data ?? body.environments ?? [];
  return {
    environmentCount: envs.length,
    sessionHint: `${envs.length} Trigger.dev environment(s) linked`,
  };
}
