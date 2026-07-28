import type { OpenRouterUsageSnapshot } from "@/lib/types";

export interface OpenRouterKeyResponse {
  data?: {
    label?: string;
    usage?: number;
    usage_daily?: number;
    usage_weekly?: number;
    usage_monthly?: number;
    limit?: number | null;
    is_free_tier?: boolean;
  };
  error?: { message: string };
}

export async function fetchOpenRouterUsage(): Promise<{
  snapshot: Omit<OpenRouterUsageSnapshot, "id" | "recordedAt">;
  raw: OpenRouterKeyResponse;
}> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const body = (await res.json()) as OpenRouterKeyResponse;
  if (!res.ok) {
    throw new Error(body.error?.message ?? `OpenRouter API error (${res.status})`);
  }

  const usageUsd = body.data?.usage ?? 0;
  const limitUsd = body.data?.limit ?? undefined;

  return {
    snapshot: {
      usageUsd,
      limitUsd: limitUsd ?? undefined,
      tokensUsed: undefined,
    },
    raw: body,
  };
}
