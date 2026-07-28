import { beforeEach, describe, expect, it } from "vitest";
import { store } from "@/lib/store/memory-store";

describe("memory store", () => {
  beforeEach(() => {
    store.reset();
  });

  it("seeds projects, tickets, and costs", () => {
    const snapshot = store.getSnapshot();
    expect(snapshot.projects.length).toBeGreaterThanOrEqual(3);
    expect(snapshot.tickets.length).toBeGreaterThanOrEqual(5);
    expect(snapshot.costs.length).toBeGreaterThanOrEqual(5);
    expect(snapshot.members.length).toBeGreaterThanOrEqual(3);
  });

  it("creates and updates a project", () => {
    const project = store.createProject({
      name: "Test Studio",
      slug: "test-studio",
      description: "A test project",
      status: "planning",
      goals: ["Ship MVP"],
      startDate: "2026-07-01",
      targetDate: "2026-09-01",
      progress: 0,
      stack: ["next", "supabase"],
    });

    expect(project.id).toBeTruthy();
    expect(store.getProject(project.id)?.name).toBe("Test Studio");

    const updated = store.updateProject(project.id, { progress: 40, status: "active" });
    expect(updated?.progress).toBe(40);
    expect(updated?.status).toBe("active");
  });

  it("creates tickets and hermes messages", () => {
    const project = store.listProjects()[0];
    const ticket = store.createTicket({
      projectId: project.id,
      title: "Wire Hermes webhook",
      description: "Connect Slack to Hermes",
      status: "todo",
      priority: "high",
      labels: ["hermes"],
    });

    expect(ticket.projectId).toBe(project.id);

    const message = store.addHermesMessage({
      channel: "in_app",
      role: "user",
      content: "Show open tickets",
    });

    expect(message.id).toBeTruthy();
    expect(store.listHermesMessages().some((m) => m.id === message.id)).toBe(true);
  });

  it("tracks team repos and budgets", () => {
    const repo = store.createRepo({
      name: "harness",
      url: "https://github.com/krakenlab/harness",
      allowedActions: ["read", "write", "agents"],
      budgetUsdMonthly: 500,
      enabled: true,
    });

    expect(repo.allowedActions).toContain("agents");

    const budget = store.createBudget({
      category: "ai",
      monthlyLimitUsd: 300,
      spentUsd: 120,
      alertThresholdPct: 80,
    });

    expect(budget.spentUsd).toBe(120);
  });
});
