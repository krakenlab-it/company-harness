import type { IntegrationProvider } from "@/lib/types";
import { fetchOpenRouterUsage } from "@/lib/integrations/openrouter";
import {
  fetchTriggerEnvironmentSummary,
  fetchTriggerRuns,
} from "@/lib/integrations/trigger";
import { fetchGcpHealthChecks, fetchGcpMonthlySpendUsd } from "@/lib/integrations/gcp";
import { fetchGitHubRepositories, matchRepoToProject } from "@/lib/integrations/github";
import {
  fetchCalendarEvents,
  fetchGmailThreads,
  getGoogleTokens,
} from "@/lib/integrations/google";
import { isProviderConfigured } from "@/lib/integrations/config";
import { store } from "@/lib/store/memory-store";
import { uid } from "@/lib/utils";

export interface SyncResult {
  provider: IntegrationProvider;
  ok: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export async function syncProvider(
  provider: IntegrationProvider,
): Promise<SyncResult> {
  store.setIntegrationStatus(provider, "syncing");

  try {
    if (!isProviderConfigured(provider) && provider !== "google") {
      throw new Error(`${provider} is not configured — add API keys to .env.local`);
    }

    switch (provider) {
      case "openrouter":
        return await syncOpenRouter();
      case "trigger":
        return await syncTrigger();
      case "google":
        return await syncGoogle();
      case "gcp":
        return await syncGcp();
      case "github":
        return await syncGitHub();
      case "resend":
        return syncResend();
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    store.setIntegrationStatus(provider, "error", message);
    return { provider, ok: false, message };
  }
}

async function syncOpenRouter(): Promise<SyncResult> {
  const { snapshot } = await fetchOpenRouterUsage();
  store.recordOpenRouterUsage(snapshot);

  const costs = store.listCosts();
  const openRouterCost = costs.find((c) => c.provider === "openrouter");
  if (openRouterCost) {
    store.updateCost(openRouterCost.id, {
      actualSpendUsd: snapshot.usageUsd,
      notes: snapshot.limitUsd
        ? `Synced from OpenRouter API — limit $${snapshot.limitUsd}`
        : "Synced from OpenRouter API",
    });
  }

  store.setIntegrationStatus("openrouter", "connected");
  return {
    provider: "openrouter",
    ok: true,
    message: `OpenRouter usage synced: $${snapshot.usageUsd.toFixed(2)}`,
    details: { usageUsd: snapshot.usageUsd, limitUsd: snapshot.limitUsd },
  };
}

async function syncTrigger(): Promise<SyncResult> {
  const [{ runs, totalEstimatedSpendUsd }, envSummary] = await Promise.all([
    fetchTriggerRuns(),
    fetchTriggerEnvironmentSummary(),
  ]);

  store.replaceTriggerRuns(
    runs.map((run) => ({
      ...run,
      id: uid("trun"),
    })),
  );

  const costs = store.listCosts();
  const triggerCost = costs.find((c) => c.provider === "trigger");
  if (triggerCost) {
    store.updateCost(triggerCost.id, {
      actualSpendUsd: totalEstimatedSpendUsd,
      notes: `${runs.length} runs synced — ${envSummary.sessionHint}`,
    });
  }

  store.setIntegrationStatus("trigger", "connected", undefined, {
    environmentCount: envSummary.environmentCount,
    runCount: runs.length,
  });

  return {
    provider: "trigger",
    ok: true,
    message: `Synced ${runs.length} Trigger.dev runs (~$${totalEstimatedSpendUsd.toFixed(2)} est.)`,
    details: { runCount: runs.length, totalEstimatedSpendUsd, ...envSummary },
  };
}

async function syncGoogle(): Promise<SyncResult> {
  if (!getGoogleTokens()) {
    throw new Error("Google OAuth not completed — connect from Integrations page");
  }

  const [threads, events] = await Promise.all([
    fetchGmailThreads(10),
    fetchCalendarEvents(10),
  ]);

  store.replaceGoogleGmailThreads(
    threads.map((t) => ({ ...t, id: uid("gmail") })),
  );
  store.replaceGoogleCalendarEvents(
    events.map((e) => ({ ...e, id: uid("gcal") })),
  );

  store.setIntegrationStatus("google", "connected", undefined, {
    gmailCount: threads.length,
    calendarCount: events.length,
  });

  return {
    provider: "google",
    ok: true,
    message: `Synced ${threads.length} Gmail threads and ${events.length} calendar events`,
    details: { gmailCount: threads.length, calendarCount: events.length },
  };
}

async function syncGcp(): Promise<SyncResult> {
  const [spendUsd, checks] = await Promise.all([
    fetchGcpMonthlySpendUsd(),
    fetchGcpHealthChecks(),
  ]);

  store.replaceGcpHealthChecks(
    checks.map((c) => ({ ...c, id: uid("gcp") })),
  );

  const costs = store.listCosts();
  const gcpCost = costs.find((c) => c.provider === "gcp");
  if (gcpCost && spendUsd > 0) {
    store.updateCost(gcpCost.id, {
      actualSpendUsd: spendUsd,
      notes: "Synced from GCP billing configuration",
    });
  }

  store.setIntegrationStatus("gcp", "connected", undefined, {
    healthCheckCount: checks.length,
    spendUsd,
  });

  return {
    provider: "gcp",
    ok: true,
    message: `GCP health: ${checks.length} checks, spend $${spendUsd.toFixed(2)}`,
    details: { spendUsd, checks },
  };
}

async function syncGitHub(): Promise<SyncResult> {
  const repos = await fetchGitHubRepositories();
  const projects = store.listProjects();

  const linked = repos.map((repo) => {
    const project = projects.find((p) => matchRepoToProject(repo.url, p.repoUrl));
    return {
      ...repo,
      id: uid("ghrepo"),
      projectId: project?.id,
      syncedAt: new Date().toISOString(),
    };
  });

  store.replaceGitHubRepositories(linked);

  for (const repo of linked) {
    if (repo.projectId) continue;
    const existingRepo = store.listRepos().find((r) => r.url === repo.url);
    if (!existingRepo) {
      store.createRepo({
        name: repo.fullName,
        url: repo.url,
        allowedActions: ["read", "write", "agents"],
        budgetUsdMonthly: 0,
        enabled: true,
      });
    }
  }

  store.setIntegrationStatus("github", "connected", undefined, {
    repoCount: linked.length,
    linkedProjects: linked.filter((r) => r.projectId).length,
  });

  return {
    provider: "github",
    ok: true,
    message: `Synced ${linked.length} GitHub repositories`,
    details: {
      repoCount: linked.length,
      linkedProjects: linked.filter((r) => r.projectId).length,
    },
  };
}

function syncResend(): SyncResult {
  store.setIntegrationStatus("resend", "connected");
  return {
    provider: "resend",
    ok: true,
    message: "Resend is configured — invite emails will send on team invite",
  };
}

export async function syncAllConfigured(): Promise<SyncResult[]> {
  const providers: IntegrationProvider[] = [
    "openrouter",
    "trigger",
    "gcp",
    "github",
    "resend",
  ];

  if (getGoogleTokens()) {
    providers.push("google");
  }

  const results: SyncResult[] = [];
  for (const provider of providers) {
    if (!isProviderConfigured(provider) && provider !== "google") continue;
    results.push(await syncProvider(provider));
  }
  return results;
}
