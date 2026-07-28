import { beforeEach, describe, expect, it } from "vitest";
import { store } from "@/lib/store/memory-store";
import { GET as getProjects, POST as postProjects } from "@/app/api/projects/route";
import { GET as getTickets, POST as postTickets } from "@/app/api/tickets/route";
import { GET as getCosts, PATCH as patchCosts } from "@/app/api/costs/route";
import { GET as getDashboard } from "@/app/api/dashboard/route";
import { POST as postHermesWebhook } from "@/app/api/hermes/webhook/route";
import { GET as getGuidelines } from "@/app/api/guidelines/route";
import { POST as postAgents } from "@/app/api/agents/route";
import { NextRequest } from "next/server";

function jsonRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("API contracts", () => {
  beforeEach(() => {
    store.reset();
    process.env.HARNESS_DEMO_MODE = "true";
    delete process.env.GROQ_API_KEY;
    delete process.env.HERMES_WEBHOOK_SECRET;
    delete process.env.CURSOR_API_KEY;
  });

  it("lists projects and creates one", async () => {
    const list = await getProjects();
    const listBody = await list.json();
    expect(list.status).toBe(200);
    expect(Array.isArray(listBody.projects ?? listBody)).toBe(true);

    const created = await postProjects(
      jsonRequest("/api/projects", "POST", {
        name: "Media Portal",
        description: "Client portal",
        status: "planning",
        goals: ["Launch beta"],
        startDate: "2026-08-01",
        targetDate: "2026-10-01",
        stack: ["next", "supabase"],
        repoId: "repo_harness",
      }),
    );
    const createdBody = await created.json();
    expect(created.status).toBeLessThan(300);
    expect(createdBody.project?.name ?? createdBody.name).toBe("Media Portal");
  });

  it("creates tickets for a project", async () => {
    const project = store.listProjects()[0];
    const res = await postTickets(
      jsonRequest("/api/tickets", "POST", {
        projectId: project.id,
        title: "Add sprint burndown",
        description: "Show sprint progress",
        status: "todo",
        priority: "medium",
        labels: ["ux"],
      }),
    );
    const body = await res.json();
    expect(res.status).toBeLessThan(300);
    expect(body.ticket?.title ?? body.title).toBe("Add sprint burndown");

    const listed = await getTickets(
      new NextRequest(
        new URL(`/api/tickets?projectId=${project.id}`, "http://localhost:3000"),
      ),
    );
    expect(listed.status).toBe(200);
  });

  it("updates provider costs", async () => {
    const cost = store.listCosts()[0];
    const res = await patchCosts(
      jsonRequest("/api/costs", "PATCH", {
        id: cost.id,
        actualSpendUsd: 42,
        monthlyBudgetUsd: cost.monthlyBudgetUsd,
      }),
    );
    expect(res.status).toBeLessThan(300);
    const get = await getCosts();
    const body = await get.json();
    expect(body.costs ?? body).toBeTruthy();
  });

  it("returns dashboard stats", async () => {
    const res = await getDashboard();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toBeTruthy();
  });

  it("answers hermes webhook messages", async () => {
    const res = await postHermesWebhook(
      jsonRequest("/api/hermes/webhook", "POST", {
        text: "Summarize project status",
      }),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.reply).toBeTruthy();
  });

  it("returns guidelines", async () => {
    const res = await getGuidelines();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(JSON.stringify(body)).toMatch(/Next\.js|Supabase/);
  });

  it("delegates agent jobs", async () => {
    const res = await postAgents(
      jsonRequest("/api/agents", "POST", {
        type: "issue",
        title: "Fix auth redirect",
        prompt: "Investigate and fix the login redirect loop",
        repo: "https://github.com/krakenlab/harness",
      }),
    );
    const body = await res.json();
    expect(res.status).toBeLessThan(300);
    expect(body.job?.title ?? body.title).toBe("Fix auth redirect");
  });
});
