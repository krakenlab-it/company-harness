import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { store } from "@/lib/store/memory-store";
import { formatUsd } from "@/lib/utils";
import { HERMES_SYSTEM_PROMPT } from "@/lib/hermes/system-prompt";
import { createHermesTools } from "@/lib/hermes/tools";
import { getHermesGroqModel } from "@/lib/hermes/config";
import { getGroqApiKey } from "@/lib/hermes/env";
import { getVisibleRepos } from "@/lib/auth/permissions";
import { DEMO_MEMBER_ID } from "@/lib/auth/config";

export interface HermesMessageInput {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface HermesContext {
  projectId?: string;
  ticketId?: string;
  contactId?: string;
}

export interface RunHermesOptions {
  messages: HermesMessageInput[];
  context?: HermesContext;
  memberId?: string;
}

export interface RunHermesResult {
  text: string;
  toolResults?: unknown[];
  offline?: boolean;
}

export function isHermesConfigured(): boolean {
  return Boolean(getGroqApiKey());
}

export function buildHarnessContext(memberId?: string): string {
  const snapshot = store.getSnapshot();
  const mid = memberId ?? DEMO_MEMBER_ID;
  const visibleRepos = getVisibleRepos(mid);
  const activeProjects = snapshot.projects.filter((p) => p.status === "active");
  const openTickets = snapshot.tickets.filter(
    (t) => t.status !== "done" && t.status !== "backlog",
  );
  const totalBudget = snapshot.costs.reduce(
    (sum, c) => sum + c.monthlyBudgetUsd,
    0,
  );
  const totalSpend = snapshot.costs.reduce(
    (sum, c) => sum + c.actualSpendUsd,
    0,
  );
  const pipelineValue = snapshot.deals
    .filter((d) => d.stage !== "won" && d.stage !== "lost")
    .reduce((sum, d) => sum + d.valueUsd * (d.probability / 100), 0);

  const lines = [
    "## Harness Snapshot",
    `Team: ${snapshot.members.length} members`,
    `Projects: ${snapshot.projects.length} total (${activeProjects.length} active)`,
    ...activeProjects.map(
      (p) =>
        `- ${p.name} (${p.progress}%): ${p.goals[0] ?? "No goals"}`,
    ),
    `Open tickets: ${openTickets.length}`,
    ...openTickets
      .filter((t) => t.priority === "critical" || t.priority === "high")
      .slice(0, 5)
      .map((t) => `- [${t.priority}] ${t.title} (${t.status})`),
    `Provider spend: ${formatUsd(totalSpend)} / ${formatUsd(totalBudget)} budgeted`,
    `CRM pipeline (weighted): ${formatUsd(pipelineValue)}`,
    `Active agent jobs: ${snapshot.agents.filter((a) => a.status === "running" || a.status === "queued").length}`,
    `Visible repos (${visibleRepos.length}): ${visibleRepos.map((r) => r.name).join(", ") || "none"}`,
    "",
    "Note: Admins/leads can delegate Cursor agents with `@cursor <prompt>` in Hermes or via the Agents page.",
  ];

  return lines.join("\n");
}

function buildOfflineResponse(
  messages: HermesMessageInput[],
  context?: HermesContext,
): string {
  const lastMessage = messages[messages.length - 1]?.content.toLowerCase() ?? "";
  const snapshot = store.getSnapshot();

  if (
    lastMessage.includes("project") ||
    lastMessage.includes("status") ||
    lastMessage.includes("progress")
  ) {
    const project = context?.projectId
      ? snapshot.projects.find((p) => p.id === context.projectId)
      : snapshot.projects.find((p) => p.status === "active");
    if (project) {
      const tickets = snapshot.tickets.filter(
        (t) => t.projectId === project.id && t.status !== "done",
      );
      return [
        `**${project.name}** is ${project.progress}% complete (${project.status}).`,
        `Target: ${project.targetDate}. Stack: ${project.stack.join(", ")}.`,
        `${tickets.length} open tickets. Top priority: ${
          tickets.find((t) => t.priority === "critical")?.title ??
          tickets[0]?.title ??
          "none"
        }.`,
        "",
        "_Running in offline demo mode — set GROQ_API_KEY for full Hermes capabilities._",
      ].join("\n");
    }
  }

  if (
    lastMessage.includes("cost") ||
    lastMessage.includes("spend") ||
    lastMessage.includes("budget")
  ) {
    const totalBudget = snapshot.costs.reduce(
      (sum, c) => sum + c.monthlyBudgetUsd,
      0,
    );
    const totalSpend = snapshot.costs.reduce(
      (sum, c) => sum + c.actualSpendUsd,
      0,
    );
    const topCosts = [...snapshot.costs]
      .sort((a, b) => b.actualSpendUsd - a.actualSpendUsd)
      .slice(0, 3);
    return [
      `Monthly provider spend: **${formatUsd(totalSpend)}** of **${formatUsd(totalBudget)}** budgeted.`,
      "Top costs:",
      ...topCosts.map(
        (c) => `- ${c.name}: ${formatUsd(c.actualSpendUsd)}`,
      ),
      "",
      "_Running in offline demo mode — set GROQ_API_KEY for full Hermes capabilities._",
    ].join("\n");
  }

  if (
    lastMessage.includes("crm") ||
    lastMessage.includes("contact") ||
    lastMessage.includes("deal") ||
    lastMessage.includes("client")
  ) {
    const activeDeals = snapshot.deals.filter(
      (d) => d.stage !== "won" && d.stage !== "lost",
    );
    return [
      `**${snapshot.contacts.length} contacts**, **${activeDeals.length} active deals**.`,
      ...activeDeals.map((d) => {
        const contact = snapshot.contacts.find(
          (c) => c.id === d.contactId,
        );
        return `- ${d.title} (${contact?.company ?? "unknown"}): ${formatUsd(d.valueUsd)} @ ${d.probability}% — ${d.stage}`;
      }),
      "",
      "_Running in offline demo mode — set GROQ_API_KEY for full Hermes capabilities._",
    ].join("\n");
  }

  if (
    lastMessage.includes("ticket") ||
    lastMessage.includes("sprint")
  ) {
    const activeSprint = snapshot.sprints.find((s) => s.status === "active");
    const sprintTickets = activeSprint
      ? snapshot.tickets.filter((t) => t.sprintId === activeSprint.id)
      : [];
    return [
      activeSprint
        ? `Active sprint: **${activeSprint.name}** — ${activeSprint.goal}`
        : "No active sprint.",
      `${sprintTickets.length} tickets in current sprint.`,
      ...sprintTickets.map(
        (t) => `- [${t.status}] ${t.title} (${t.priority})`,
      ),
      "",
      "_Running in offline demo mode — set GROQ_API_KEY for full Hermes capabilities._",
    ].join("\n");
  }

  if (
    lastMessage.includes("stack") ||
    lastMessage.includes("guideline") ||
    lastMessage.includes("tech")
  ) {
    return [
      "KrakenLab's preferred stack: **Next.js**, **Supabase**, **Redis** (heavy queries), **Gemini** (AI), **GCP** + **Terraform** (infra), **Vercel** (hosting), **trigger.dev** (background), **OpenRouter + AI SDK** (AI-heavy apps).",
      "",
      "Ask me about a specific area — projects, costs, CRM, tickets, or agent delegation.",
      "",
      "_Running in offline demo mode — set GROQ_API_KEY for full Hermes capabilities._",
    ].join("\n");
  }

  return [
    "Hi! I'm **Hermes**, KrakenLab Media's harness assistant.",
    "",
    `I can see ${snapshot.projects.length} projects, ${snapshot.tickets.length} tickets, and ${snapshot.contacts.length} CRM contacts.`,
    "Try asking about project status, cloud spend, CRM pipeline, or open tickets.",
    "",
    "_Running in offline demo mode — set GROQ_API_KEY for full Hermes capabilities._",
  ].join("\n");
}

export async function runHermes(
  options: RunHermesOptions,
): Promise<RunHermesResult> {
  const { messages, context } = options;
  const lastUserMessage = messages.filter((m) => m.role === "user").pop();

  if (lastUserMessage) {
    store.addHermesMessage({
      channel: "in_app",
      role: "user",
      content: lastUserMessage.content,
      contextType: context?.projectId ? "project" : undefined,
      contextId: context?.projectId,
    });
  }

  const modelId = getHermesGroqModel();
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    const text = buildOfflineResponse(messages, context);
    store.addHermesMessage({
      channel: "in_app",
      role: "assistant",
      content: text,
    });
    return { text, offline: true };
  }

  const groq = createGroq({ apiKey });
  const tools = createHermesTools({ memberId: options.memberId });
  const harnessContext = buildHarnessContext(options.memberId);

  const result = await generateText({
    model: groq(modelId),
    system: `${HERMES_SYSTEM_PROMPT}\n\n${harnessContext}`,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    tools,
    maxRetries: 2,
  });

  store.addHermesMessage({
    channel: "in_app",
    role: "assistant",
    content: result.text,
  });

  return {
    text: result.text,
    toolResults: result.toolResults,
    offline: false,
  };
}
