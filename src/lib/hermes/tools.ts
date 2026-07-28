import { z } from "zod";
import { tool } from "ai";
import { store } from "@/lib/store/memory-store";
import { PREFERRED_STACK } from "@/lib/guidelines/stack-guidelines";
import { getVisibleRepos } from "@/lib/auth/permissions";
import { DEMO_MEMBER_ID } from "@/lib/auth/config";
import type { TicketStatus } from "@/lib/types";

export const listProjectsSchema = z.object({
  status: z
    .enum(["planning", "active", "paused", "shipped"])
    .optional()
    .describe("Filter projects by status"),
});

export const getProjectStatusSchema = z.object({
  projectId: z.string().describe("Project ID or slug"),
});

export const listTicketsSchema = z.object({
  projectId: z.string().optional().describe("Filter by project ID"),
  status: z
    .enum(["backlog", "todo", "in_progress", "review", "done"])
    .optional()
    .describe("Filter by ticket status"),
});

export const createTicketSchema = z.object({
  projectId: z.string().describe("Project ID"),
  title: z.string().describe("Ticket title"),
  description: z.string().describe("Ticket description"),
  priority: z
    .enum(["low", "medium", "high", "critical"])
    .default("medium"),
  assigneeId: z.string().optional().describe("Team member ID"),
  labels: z.array(z.string()).optional(),
});

export const updateTicketSchema = z.object({
  ticketId: z.string().describe("Ticket ID"),
  status: z
    .enum(["backlog", "todo", "in_progress", "review", "done"])
    .optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  assigneeId: z.string().optional(),
  hermesNotes: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

export const ticketIdSchema = z.object({
  ticketId: z.string().describe("Ticket ID"),
});

export const scanRepoContextSchema = z.object({
  repoUrl: z.string().describe("Repository URL or name"),
});

export const listCostsSchema = z.object({
  provider: z
    .enum([
      "vercel",
      "supabase",
      "stripe",
      "openai",
      "groq",
      "trigger",
      "resend",
      "gcp",
      "redis",
      "openrouter",
      "other",
    ])
    .optional()
    .describe("Filter by provider"),
});

export const updateCostSchema = z.object({
  costId: z.string().describe("Provider cost ID"),
  monthlyBudgetUsd: z.number().optional(),
  actualSpendUsd: z.number().optional(),
  notes: z.string().optional(),
});

export const listCrmContactsSchema = z.object({
  status: z
    .enum(["lead", "active", "churned", "partner"])
    .optional()
    .describe("Filter by contact status"),
});

export const createCrmNoteSchema = z.object({
  contactId: z.string().describe("CRM contact ID"),
  note: z.string().describe("Note to append to contact record"),
  hermesInsight: z.string().optional().describe("AI-generated insight"),
});

export const listAgentJobsSchema = z.object({
  status: z
    .enum(["queued", "running", "completed", "failed", "cancelled"])
    .optional()
    .describe("Filter by job status"),
});

export const getGuidelinesSchema = z.object({
  section: z
    .string()
    .optional()
    .describe("Optional section ID (framework, database, ai, infra, etc.)"),
});

export const createTicketsForReposSchema = z.object({
  title: z.string().describe("Ticket title applied to each repo/project"),
  description: z.string().describe("Ticket description"),
  priority: z
    .enum(["low", "medium", "high", "critical"])
    .default("medium"),
  labels: z.array(z.string()).optional(),
});

export const getTeamBudgetSchema = z.object({
  category: z.string().optional().describe("Filter by budget category"),
});

export function createHermesTools(options?: { memberId?: string }) {
  const memberId = options?.memberId ?? DEMO_MEMBER_ID;

  function updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    summary: string,
  ) {
    const updated = store.updateTicket(ticketId, { status });
    if (!updated) return { error: "Ticket not found" };
    store.addActivity({
      projectId: updated.projectId,
      entityType: "ticket",
      entityId: ticketId,
      action: "updated",
      summary,
    });
    return updated;
  }

  return {
    list_visible_repos: tool({
      description: "List GitHub repos the current user can access.",
      inputSchema: z.object({}),
      execute: async () => getVisibleRepos(memberId),
    }),
    scan_repo_context: tool({
      description:
        "Scan stack dependencies, open tickets, and recent agent jobs for a repo.",
      inputSchema: scanRepoContextSchema,
      execute: async ({ repoUrl }) => {
        const repo =
          store.findRepoByUrl(repoUrl) ??
          getVisibleRepos(memberId).find((r) => r.name.includes(repoUrl));
        if (!repo) return { error: "Repo not found or not visible" };
        const project = store.listProjects().find(
          (p) =>
            p.repoUrl &&
            p.repoUrl.replace(/\/$/, "") === repo.url.replace(/\/$/, ""),
        );
        const stack = store.listStack().filter((s) => s.repoId === repo.id);
        const tickets = project
          ? store.listTickets({ projectId: project.id })
          : [];
        const agents = store
          .listAgentJobs()
          .filter((j) => j.repo?.includes(repo.name))
          .slice(0, 10);
        return { repo, stack, tickets, agents, project };
      },
    }),
    list_projects: tool({
      description: "List all projects in the harness, optionally filtered by status.",
      inputSchema: listProjectsSchema,
      execute: async ({ status }) => {
        const projects = store.listProjects();
        return status
          ? projects.filter((p) => p.status === status)
          : projects;
      },
    }),
    get_project_status: tool({
      description:
        "Get detailed status for a project including progress, goals, stack, and related tickets.",
      inputSchema: getProjectStatusSchema,
      execute: async ({ projectId }) => {
        const project =
          store.getProject(projectId) ??
          store.listProjects().find((p) => p.slug === projectId);
        if (!project) return { error: "Project not found" };
        const tickets = store.listTickets({ projectId: project.id });
        const sprints = store.listSprints(project.id);
        return { project, tickets, sprints };
      },
    }),
    list_tickets: tool({
      description: "List tickets, optionally filtered by project or status.",
      inputSchema: listTicketsSchema,
      execute: async ({ projectId, status }) => {
        return store.listTickets({ projectId, status });
      },
    }),
    create_ticket: tool({
      description: "Create a new ticket in a project (opens work).",
      inputSchema: createTicketSchema,
      execute: async (input) => {
        const ticket = store.createTicket({
          projectId: input.projectId,
          title: input.title,
          description: input.description,
          status: "todo",
          priority: input.priority,
          assigneeId: input.assigneeId,
          labels: input.labels ?? [],
        });
        store.addActivity({
          projectId: input.projectId,
          entityType: "ticket",
          entityId: ticket.id,
          action: "created",
          summary: `Created ticket: ${ticket.title}`,
        });
        return ticket;
      },
    }),
    create_tickets_for_repos: tool({
      description:
        "Create the same ticket on every visible repo/project (e.g. add tests to all repos). Prefer this for multi-repo work.",
      inputSchema: createTicketsForReposSchema,
      execute: async (input) => {
        const repos = getVisibleRepos(memberId);
        const created: Array<{ repo: string; ticket: ReturnType<typeof store.createTicket> }> = [];
        const skipped: string[] = [];

        for (const repo of repos) {
          const project = store.listProjects().find((p) => {
            if (!p.repoUrl) return false;
            const a = p.repoUrl.replace(/\.git$/, "").replace(/\/$/, "").toLowerCase();
            const b = repo.url.replace(/\.git$/, "").replace(/\/$/, "").toLowerCase();
            return a === b || a.endsWith(`/${repo.name.toLowerCase()}`);
          });

          if (!project) {
            skipped.push(repo.name);
            continue;
          }

          const ticket = store.createTicket({
            projectId: project.id,
            title: input.title,
            description: input.description,
            status: "todo",
            priority: input.priority,
            labels: input.labels ?? ["hermes", "multi-repo"],
          });
          store.addActivity({
            projectId: project.id,
            entityType: "ticket",
            entityId: ticket.id,
            action: "created",
            summary: `Hermes created ticket on ${repo.name}: ${ticket.title}`,
          });
          created.push({ repo: repo.name, ticket });
        }

        return { created, skipped, count: created.length };
      },
    }),
    update_ticket: tool({
      description: "Update ticket fields including status, priority, and notes.",
      inputSchema: updateTicketSchema,
      execute: async ({ ticketId, ...patch }) => {
        const updated = store.updateTicket(ticketId, patch);
        if (!updated) return { error: "Ticket not found" };
        store.addActivity({
          projectId: updated.projectId,
          entityType: "ticket",
          entityId: ticketId,
          action: "updated",
          summary: `Updated ticket: ${updated.title}`,
        });
        return updated;
      },
    }),
    close_ticket: tool({
      description: "Close a ticket by setting status to done.",
      inputSchema: ticketIdSchema,
      execute: async ({ ticketId }) =>
        updateTicketStatus(ticketId, "done", `Closed ticket ${ticketId}`),
    }),
    reopen_ticket: tool({
      description: "Reopen a closed ticket to todo.",
      inputSchema: ticketIdSchema,
      execute: async ({ ticketId }) =>
        updateTicketStatus(ticketId, "todo", `Reopened ticket ${ticketId}`),
    }),
    list_costs: tool({
      description: "List provider costs and spend data.",
      inputSchema: listCostsSchema,
      execute: async ({ provider }) => {
        const costs = store.listCosts();
        return provider
          ? costs.filter((c) => c.provider === provider)
          : costs;
      },
    }),
    update_cost: tool({
      description: "Update a provider cost entry (budget, spend, or notes).",
      inputSchema: updateCostSchema,
      execute: async ({ costId, ...patch }) => {
        const updated = store.updateCost(costId, patch);
        if (!updated) return { error: "Cost entry not found" };
        return updated;
      },
    }),
    list_crm_contacts: tool({
      description: "List CRM contacts with optional status filter.",
      inputSchema: listCrmContactsSchema,
      execute: async ({ status }) => {
        const contacts = store.listContacts();
        return status
          ? contacts.filter((c) => c.status === status)
          : contacts;
      },
    }),
    create_crm_note: tool({
      description: "Add a note or Hermes insight to a CRM contact.",
      inputSchema: createCrmNoteSchema,
      execute: async ({ contactId, note, hermesInsight }) => {
        const contact = store.getContact(contactId);
        if (!contact) return { error: "Contact not found" };
        const existingNotes = contact.notes ?? "";
        const updated = store.updateContact(contactId, {
          notes: existingNotes ? `${existingNotes}\n\n${note}` : note,
          hermesInsight: hermesInsight ?? contact.hermesInsight,
          lastContactAt: new Date().toISOString(),
        });
        store.addActivity({
          entityType: "contact",
          entityId: contactId,
          action: "note_added",
          summary: `Note added to ${contact.name}`,
        });
        return updated;
      },
    }),
    list_agent_jobs: tool({
      description: "List Cursor agent jobs and their status (read-only).",
      inputSchema: listAgentJobsSchema,
      execute: async ({ status }) => {
        const jobs = store.listAgentJobs();
        return status ? jobs.filter((j) => j.status === status) : jobs;
      },
    }),
    get_guidelines: tool({
      description:
        "Get KrakenLab preferred stack guidelines and team standards.",
      inputSchema: getGuidelinesSchema,
      execute: async ({ section }) => {
        if (section) {
          const found = PREFERRED_STACK.sections.find((s) => s.id === section);
          return (
            found ?? {
              error: "Section not found",
              available: PREFERRED_STACK.sections.map((s) => s.id),
            }
          );
        }
        return PREFERRED_STACK;
      },
    }),
    get_team_budget: tool({
      description: "Get team budget categories with limits and spend.",
      inputSchema: getTeamBudgetSchema,
      execute: async ({ category }) => {
        const budgets = store.listBudgets();
        return category
          ? budgets.filter(
              (b) => b.category.toLowerCase() === category.toLowerCase(),
            )
          : budgets;
      },
    }),
  };
}

export type HermesToolName = keyof ReturnType<typeof createHermesTools>;
