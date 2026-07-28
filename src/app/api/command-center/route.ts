import { NextResponse } from "next/server";
import {
  requireAuth,
  getVisibleRepos,
  hasAnyAgentsPermission,
} from "@/lib/auth";
import { AuthError } from "@/lib/auth/permissions";
import { store } from "@/lib/store/memory-store";
import { jsonError } from "@/lib/api/response";
import { isProviderConfigured } from "@/lib/integrations/config";
import type { IntegrationProvider } from "@/lib/types";

function stackHealthPct(stack: ReturnType<typeof store.listStack>): number {
  if (stack.length === 0) return 100;
  const healthy = stack.filter((s) => s.status === "healthy").length;
  return Math.round((healthy / stack.length) * 100);
}

function repoHealth(repoId: string): "ok" | "warn" | "unknown" {
  const stack = store.listStack().filter((s) => s.repoId === repoId);
  if (stack.length === 0) return "unknown";
  if (stackHealthPct(stack) >= 80) return "ok";
  return "warn";
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const url = new URL(request.url);
    const repoFilter = url.searchParams.get("repo");

    const visibleRepos = getVisibleRepos(session.memberId);
    const filtered = repoFilter
      ? visibleRepos.filter(
          (r) => r.name === repoFilter || r.url.includes(repoFilter),
        )
      : visibleRepos;

    const rows = filtered.map((repo) => {
      const project = store.listProjects().find(
        (p) =>
          p.repoUrl &&
          p.repoUrl.replace(/\/$/, "").toLowerCase() ===
            repo.url.replace(/\/$/, "").toLowerCase(),
      );
      const stack = store.listStack().filter((s) => s.repoId === repo.id);
      const tickets = project
        ? store
            .listTickets({ projectId: project.id })
            .filter((t) => t.status !== "done")
        : [];
      const agents = store
        .listAgentJobs()
        .filter((j) => j.repo && j.repo.includes(repo.name.split("/").pop() ?? repo.name));
      const activeAgents = agents.filter((j) =>
        ["queued", "running"].includes(j.status),
      );

      return {
        repo,
        project,
        stackCount: stack.length,
        stackHealthPct: stack.length ? stackHealthPct(stack) : null,
        openTickets: tickets.length,
        activeAgents: activeAgents.length,
        spendUsd: repo.budgetUsdMonthly,
        health: repoHealth(repo.id),
      };
    });

    const stats = {
      repos: rows.length,
      openTickets: rows.reduce((n, r) => n + r.openTickets, 0),
      activeAgents: rows.reduce((n, r) => n + r.activeAgents, 0),
      spendUsd: store.listCosts().reduce((n, c) => n + c.actualSpendUsd, 0),
      stackHealthPct: stackHealthPct(store.listStack()),
    };

    const providers: IntegrationProvider[] = [
      "openrouter",
      "trigger",
      "gcp",
      "github",
      "resend",
    ];
    const connectors = providers.map((p) => ({
      provider: p,
      configured: isProviderConfigured(p),
      connection: store.listIntegrationConnections().find((c) => c.provider === p),
    }));

    const recentActivity = store.getSnapshot().activities.slice(0, 8);
    const agentJobs = store.listAgentJobs().slice(0, 10).map((j) => ({
      ...j,
      actor: j.actorId ? store.getMember(j.actorId) : undefined,
    }));

    return NextResponse.json({
      stats,
      rows,
      connectors,
      recentActivity,
      agentJobs,
      canDelegate: hasAnyAgentsPermission(session.memberId),
      session: { memberId: session.memberId, role: session.role },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to load command center");
  }
}
