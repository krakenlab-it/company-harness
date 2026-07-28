import { NextResponse } from "next/server";
import { getCostRollup, scoreStackHealth } from "@/lib/stack/analyzer";
import { store } from "@/lib/store/memory-store";
import { jsonError } from "@/lib/api/response";

export async function GET() {
  try {
    const snapshot = store.getSnapshot();
    const activeProjects = snapshot.projects.filter(
      (p) => p.status === "active",
    );
    const openTickets = snapshot.tickets.filter(
      (t) => t.status !== "done" && t.status !== "backlog",
    );
    const agentJobs = snapshot.agents.filter(
      (a) => a.status === "queued" || a.status === "running",
    );
    const costRollup = getCostRollup();
    const stackHealth = scoreStackHealth();
    const recentActivity = snapshot.activities.slice(0, 10);

    const pipelineDeals = snapshot.deals.filter(
      (d) => d.stage !== "won" && d.stage !== "lost",
    );

    return NextResponse.json({
      stats: {
        projectsActive: activeProjects.length,
        projectsTotal: snapshot.projects.length,
        openTickets: openTickets.length,
        ticketsTotal: snapshot.tickets.length,
        agentJobs: agentJobs.length,
        agentJobsTotal: snapshot.agents.length,
        costSpendUsd: costRollup.totalSpendUsd,
        costBudgetUsd: costRollup.totalBudgetUsd,
        costUtilizationPct: Math.round(costRollup.utilizationPct),
        stackHealthPct: Math.round(stackHealth.healthPct),
        stackTotal: stackHealth.total,
        contacts: snapshot.contacts.length,
        activeDeals: pipelineDeals.length,
        teamMembers: snapshot.members.length,
      },
      costRollup,
      stackHealth,
      recentActivity,
      activeProjects: activeProjects.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        progress: p.progress,
        status: p.status,
      })),
    });
  } catch {
    return jsonError("Failed to load dashboard stats");
  }
}
