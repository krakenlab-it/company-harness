import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/response";
import { syncProvider } from "@/lib/integrations/sync";
import { isProviderConfigured, getProviderEnvConfigs } from "@/lib/integrations/config";
import { store } from "@/lib/store/memory-store";
import type { IntegrationProvider } from "@/lib/types";

const VALID: IntegrationProvider[] = [
  "openrouter",
  "trigger",
  "google",
  "gcp",
  "github",
  "resend",
];

function isValidProvider(value: string): value is IntegrationProvider {
  return VALID.includes(value as IntegrationProvider);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: raw } = await context.params;
  if (!isValidProvider(raw)) {
    return jsonError("Unknown integration provider", 404);
  }

  const config = getProviderEnvConfigs().find((c) => c.provider === raw);
  const connection = store
    .listIntegrationConnections()
    .find((c) => c.provider === raw);

  return NextResponse.json({
    provider: raw,
    configured: isProviderConfigured(raw),
    config,
    connection,
  });
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: raw } = await context.params;
  if (!isValidProvider(raw)) {
    return jsonError("Unknown integration provider", 404);
  }

  const result = await syncProvider(raw);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
