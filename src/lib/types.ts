export type TeamMemberRole = "admin" | "lead" | "dev" | "viewer";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  avatar?: string;
  createdAt: string;
}

export type ProjectStatus = "planning" | "active" | "paused" | "shipped";

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: ProjectStatus;
  goals: string[];
  startDate: string;
  targetDate: string;
  progress: number;
  repoUrl?: string;
  stack: string[];
  createdAt: string;
  updatedAt: string;
}

export type SprintStatus = "planned" | "active" | "completed";

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  ticketIds: string[];
}

export type TicketStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "review"
  | "done";

export type TicketPriority = "low" | "medium" | "high" | "critical";

export interface Ticket {
  id: string;
  projectId: string;
  sprintId?: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId?: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  hermesNotes?: string;
}

export interface ActivityEvent {
  id: string;
  projectId?: string;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  actorId?: string;
  createdAt: string;
}

export type ProviderName =
  | "vercel"
  | "supabase"
  | "stripe"
  | "openai"
  | "groq"
  | "trigger"
  | "resend"
  | "gcp"
  | "redis"
  | "openrouter"
  | "other";

export interface ProviderCost {
  id: string;
  provider: ProviderName;
  name: string;
  monthlyBudgetUsd: number;
  actualSpendUsd: number;
  notes?: string;
  updatedAt: string;
}

export type StackCategory =
  | "framework"
  | "database"
  | "ai"
  | "payments"
  | "email"
  | "infra"
  | "background"
  | "cache"
  | "hosting"
  | "other";

export type StackStatus = "healthy" | "outdated" | "deprecated" | "unknown";

export interface StackDependency {
  id: string;
  projectId?: string;
  name: string;
  category: StackCategory;
  version?: string;
  critical: boolean;
  status: StackStatus;
  notes?: string;
}

export type CursorAgentJobType =
  | "issue"
  | "pr"
  | "feature"
  | "bugfix"
  | "refactor";

export type CursorAgentJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface CursorAgentJob {
  id: string;
  type: CursorAgentJobType;
  title: string;
  prompt: string;
  status: CursorAgentJobStatus;
  cursorAgentId?: string;
  prUrl?: string;
  repo?: string;
  createdAt: string;
  updatedAt: string;
  resultSummary?: string;
}

export type CrmContactStatus = "lead" | "active" | "churned" | "partner";

export interface CrmContact {
  id: string;
  name: string;
  email?: string;
  company?: string;
  status: CrmContactStatus;
  ownerId?: string;
  notes?: string;
  hermesInsight?: string;
  lastContactAt?: string;
  createdAt: string;
}

export type CrmDealStage =
  | "discovery"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export interface CrmDeal {
  id: string;
  contactId: string;
  title: string;
  valueUsd: number;
  stage: CrmDealStage;
  probability: number;
  expectedClose?: string;
  hermesInsight?: string;
  createdAt: string;
}

export type RepoAction = "read" | "write" | "agents" | "deploy" | "secrets";

export interface TeamRepo {
  id: string;
  name: string;
  url: string;
  allowedActions: RepoAction[];
  budgetUsdMonthly: number;
  enabled: boolean;
}

export interface TeamBudget {
  id: string;
  category: string;
  monthlyLimitUsd: number;
  spentUsd: number;
  alertThresholdPct: number;
}

export type HermesChannel = "in_app" | "webhook";

export type HermesRole = "user" | "assistant" | "system";

export interface HermesMessage {
  id: string;
  channel: HermesChannel;
  role: HermesRole;
  content: string;
  contextType?: string;
  contextId?: string;
  createdAt: string;
}

export interface HarnessSnapshot {
  projects: Project[];
  sprints: Sprint[];
  tickets: Ticket[];
  activities: ActivityEvent[];
  costs: ProviderCost[];
  stack: StackDependency[];
  agents: CursorAgentJob[];
  contacts: CrmContact[];
  deals: CrmDeal[];
  members: TeamMember[];
  repos: TeamRepo[];
  budgets: TeamBudget[];
  hermesMessages: HermesMessage[];
}
