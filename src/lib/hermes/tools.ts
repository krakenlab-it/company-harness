import { z } from "zod";
import { tool } from "ai";
import { store } from "@/lib/store/memory-store";
import { PREFERRED_STACK } from "@/lib/guidelines/stack-guidelines";
import { delegateToCursor } from "@/lib/cursor/client";

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

export const delegateToCursorSchema = z.object({
  type: z.enum(["issue", "pr", "feature", "bugfix", "refactor"]),
  title: z.string().describe("Short title for the agent job"),
  prompt: z.string().describe("Detailed instructions for the Cursor agent"),
  repo: z.string().optional().describe("Repository URL"),
});

export const getGuidelinesSchema = z.object({
  section: z
    .string()
    .optional()
    .describe("Optional section ID (framework, database, ai, infra, etc.)"),
});

export const getTeamBudgetSchema = z.object({
  category: z.string().optional().describe("Filter by budget category"),
});

export const hermesToolDescriptors = {
  list_projects: {
    name: "list_projects",
    description: "List all projects in the harness, optionally filtered by status.",
    parameters: listProjectsSchema,
  },
  get_project_status: {
    name: "get_project_status",
    description:
      "Get detailed status for a project including progress, goals, stack, and related tickets.",
    parameters: getProjectStatusSchema,
  },
  list_tickets: {
    name: "list_tickets",
    description: "List tickets, optionally filtered by project or status.",
    parameters: listTicketsSchema,
  },
  create_ticket: {
    name: "create_ticket",
    description: "Create a new ticket in a project.",
    parameters: createTicketSchema,
  },
  list_costs: {
    name: "list_costs",
    description: "List provider costs and spend data.",
    parameters: listCostsSchema,
  },
  update_cost: {
    name: "update_cost",
    description: "Update a provider cost entry (budget, spend, or notes).",
    parameters: updateCostSchema,
  },
  list_crm_contacts: {
    name: "list_crm_contacts",
    description: "List CRM contacts with optional status filter.",
    parameters: listCrmContactsSchema,
  },
  create_crm_note: {
    name: "create_crm_note",
    description: "Add a note or Hermes insight to a CRM contact.",
    parameters: createCrmNoteSchema,
  },
  list_agent_jobs: {
    name: "list_agent_jobs",
    description: "List Cursor agent jobs and their status.",
    parameters: listAgentJobsSchema,
  },
  delegate_to_cursor: {
    name: "delegate_to_cursor",
    description:
      "Delegate a coding task to a Cursor Cloud Agent. Queues locally if API is unavailable.",
    parameters: delegateToCursorSchema,
  },
  get_guidelines: {
    name: "get_guidelines",
    description:
      "Get KrakenLab preferred stack guidelines and team standards.",
    parameters: getGuidelinesSchema,
  },
  get_team_budget: {
    name: "get_team_budget",
    description: "Get team budget categories with limits and spend.",
    parameters: getTeamBudgetSchema,
  },
} as const;

export function createHermesTools() {
  return {
    list_projects: tool({
      description: hermesToolDescriptors.list_projects.description,
      inputSchema: listProjectsSchema,
      execute: async ({ status }) => {
        const projects = store.listProjects();
        return status
          ? projects.filter((p) => p.status === status)
          : projects;
      },
    }),
    get_project_status: tool({
      description: hermesToolDescriptors.get_project_status.description,
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
      description: hermesToolDescriptors.list_tickets.description,
      inputSchema: listTicketsSchema,
      execute: async ({ projectId, status }) => {
        return store.listTickets({ projectId, status });
      },
    }),
    create_ticket: tool({
      description: hermesToolDescriptors.create_ticket.description,
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
    list_costs: tool({
      description: hermesToolDescriptors.list_costs.description,
      inputSchema: listCostsSchema,
      execute: async ({ provider }) => {
        const costs = store.listCosts();
        return provider
          ? costs.filter((c) => c.provider === provider)
          : costs;
      },
    }),
    update_cost: tool({
      description: hermesToolDescriptors.update_cost.description,
      inputSchema: updateCostSchema,
      execute: async ({ costId, ...patch }) => {
        const updated = store.updateCost(costId, patch);
        if (!updated) return { error: "Cost entry not found" };
        return updated;
      },
    }),
    list_crm_contacts: tool({
      description: hermesToolDescriptors.list_crm_contacts.description,
      inputSchema: listCrmContactsSchema,
      execute: async ({ status }) => {
        const contacts = store.listContacts();
        return status
          ? contacts.filter((c) => c.status === status)
          : contacts;
      },
    }),
    create_crm_note: tool({
      description: hermesToolDescriptors.create_crm_note.description,
      inputSchema: createCrmNoteSchema,
      execute: async ({ contactId, note, hermesInsight }) => {
        const contact = store.getContact(contactId);
        if (!contact) return { error: "Contact not found" };
        const existingNotes = contact.notes ?? "";
        const updated = store.updateContact(contactId, {
          notes: existingNotes
            ? `${existingNotes}\n\n${note}`
            : note,
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
      description: hermesToolDescriptors.list_agent_jobs.description,
      inputSchema: listAgentJobsSchema,
      execute: async ({ status }) => {
        const jobs = store.listAgentJobs();
        return status ? jobs.filter((j) => j.status === status) : jobs;
      },
    }),
    delegate_to_cursor: tool({
      description: hermesToolDescriptors.delegate_to_cursor.description,
      inputSchema: delegateToCursorSchema,
      execute: async (input) => delegateToCursor(input),
    }),
    get_guidelines: tool({
      description: hermesToolDescriptors.get_guidelines.description,
      inputSchema: getGuidelinesSchema,
      execute: async ({ section }) => {
        if (section) {
          const found = PREFERRED_STACK.sections.find(
            (s) => s.id === section,
          );
          return found ?? { error: "Section not found", available: PREFERRED_STACK.sections.map((s) => s.id) };
        }
        return PREFERRED_STACK;
      },
    }),
    get_team_budget: tool({
      description: hermesToolDescriptors.get_team_budget.description,
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

export type HermesToolName = keyof typeof hermesToolDescriptors;
