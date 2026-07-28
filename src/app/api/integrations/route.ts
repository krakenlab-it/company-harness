import { NextResponse } from "next/server";
import {
  requireAuth,
  canAccessIntegrations,
  AuthError,
} from "@/lib/auth";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import { store } from "@/lib/store/memory-store";
import { syncAllConfigured } from "@/lib/integrations/sync";
import type { IntegrationProvider } from "@/lib/types";

export async function GET() {
  try {
    const session = await requireAuth();
    if (!canAccessIntegrations(session)) {
      return jsonError("Forbidden", 403);
    }
    store.refreshIntegrationConnectionsFromEnv();

  return NextResponse.json({
    connections: store.listIntegrationConnections(),
    openRouterUsage: store.listOpenRouterUsage(10),
    triggerRuns: store.listTriggerRuns(10),
    googleCalendarEvents: store.listGoogleCalendarEvents(),
    googleGmailThreads: store.listGoogleGmailThreads(),
    gcpHealthChecks: store.listGcpHealthChecks(),
    githubRepositories: store.listGitHubRepositories(),
  });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to load integrations");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    if (!canAccessIntegrations(session)) {
      return jsonError("Forbidden", 403);
    }
    const body = await parseJsonBody<{ action?: string; provider?: IntegrationProvider }>(
    request,
  );

  if (body?.action === "sync_all") {
    const results = await syncAllConfigured();
    return NextResponse.json({ results });
  }

  return jsonError("Use POST /api/integrations/[provider] to sync a single provider", 400);
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to sync integrations");
  }
}
