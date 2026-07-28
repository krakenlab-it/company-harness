export type TeamMemberRole =
  | "admin"
  | "lead"
  | "dev"
  | "marketing"
  | "viewer";

/** Preset invitation template controlling default role, nav, and repo access */
export type InviteMode = "admin" | "dev" | "marketing" | "custom";

/** Per-member navigation and area visibility */
export interface MemberViewSettings {
  commandCenter: boolean;
  repos: boolean;
  work: boolean;
  marketing: boolean;
  hermes: boolean;
  agents: boolean;
  integrations: boolean;
  team: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  inviteMode?: InviteMode;
  viewSettings?: MemberViewSettings;
  avatar?: string;
  authUserId?: string;
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
  /** Canonical harness repo id (team_repos) */
  repoId?: string;
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
  startDate?: string;
  dueDate?: string;
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
  repoId?: string;
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
  | "refactor"
  | "merge_conflict";

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
  actorId?: string;
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

export interface HermesComposerTagMeta {
  kind: "cursor" | "marketing" | "repo" | "ticket" | "pr" | "project";
  value: string;
  label: string;
}

export interface HermesMessage {
  id: string;
  channel: HermesChannel;
  role: HermesRole;
  content: string;
  contextType?: string;
  contextId?: string;
  composerTags?: HermesComposerTagMeta[];
  createdAt: string;
}

export type IntegrationProvider =
  | "openrouter"
  | "trigger"
  | "google"
  | "gcp"
  | "github"
  | "resend";

export type IntegrationStatus =
  | "connected"
  | "disconnected"
  | "error"
  | "syncing";

export interface IntegrationConnection {
  id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  label: string;
  configured: boolean;
  lastSyncAt?: string;
  lastError?: string;
  metadata?: Record<string, unknown>;
}

export type TeamInviteStatus = "pending" | "accepted" | "expired" | "revoked";

export interface TeamInvite {
  id: string;
  email: string;
  name?: string;
  role: TeamMemberRole;
  inviteMode?: InviteMode;
  viewSettings?: Partial<MemberViewSettings>;
  repoActions?: RepoAction[];
  token: string;
  projectIds: string[];
  invitedById?: string;
  status: TeamInviteStatus;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface ProjectAssignment {
  id: string;
  projectId: string;
  memberId?: string;
  email: string;
  role: TeamMemberRole;
  assignedAt: string;
}

export interface TriggerJobRun {
  id: string;
  externalRunId: string;
  taskId: string;
  status: string;
  durationMs?: number;
  costUsd?: number;
  projectId?: string;
  startedAt: string;
  finishedAt?: string;
}

export interface OpenRouterUsageSnapshot {
  id: string;
  usageUsd: number;
  limitUsd?: number;
  tokensUsed?: number;
  recordedAt: string;
}

export interface GoogleCalendarEventSummary {
  id: string;
  externalId: string;
  title: string;
  startAt: string;
  endAt: string;
  attendees: string[];
}

export interface GoogleGmailThreadSummary {
  id: string;
  externalId: string;
  subject: string;
  from: string;
  snippet: string;
  receivedAt: string;
}

export type GcpHealthStatus = "healthy" | "degraded" | "down" | "unknown";

export interface GcpHealthCheck {
  id: string;
  service: string;
  status: GcpHealthStatus;
  message?: string;
  checkedAt: string;
}

export interface GitHubRepositorySync {
  id: string;
  externalId: number;
  name: string;
  fullName: string;
  url: string;
  defaultBranch: string;
  lastPushAt?: string;
  openIssues: number;
  projectId?: string;
  repoId?: string;
  syncedAt: string;
}

export interface RepoAccess {
  id: string;
  memberId: string;
  repoId: string;
  actions: RepoAction[];
  grantedBy?: string;
  grantedAt: string;
}

export interface DelegationAudit {
  id: string;
  jobId: string;
  actorId: string;
  repoUrl: string;
  type: CursorAgentJobType;
  promptHash?: string;
  status: CursorAgentJobStatus;
  prUrl?: string;
  createdAt: string;
}

export type MarketingTaskCategory =
  | "landing_page"
  | "ui_redesign"
  | "brand_copy"
  | "social_campaign"
  | "email_campaign"
  | "other";

export type MarketingTaskStatus =
  | "requested"
  | "in_progress"
  | "review"
  | "done"
  | "cancelled";

export type MarketingTaskPriority = "low" | "medium" | "high";

export interface MarketingTask {
  id: string;
  title: string;
  brief: string;
  category: MarketingTaskCategory;
  status: MarketingTaskStatus;
  priority: MarketingTaskPriority;
  requesterId: string;
  assigneeId?: string;
  projectId?: string;
  targetUrl?: string;
  dueDate?: string;
  labels: string[];
  source: "marketing_ui" | "hermes" | "api";
  createdAt: string;
  updatedAt: string;
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
  integrationConnections: IntegrationConnection[];
  teamInvites: TeamInvite[];
  projectAssignments: ProjectAssignment[];
  triggerRuns: TriggerJobRun[];
  openRouterUsage: OpenRouterUsageSnapshot[];
  googleCalendarEvents: GoogleCalendarEventSummary[];
  googleGmailThreads: GoogleGmailThreadSummary[];
  gcpHealthChecks: GcpHealthCheck[];
  githubRepositories: GitHubRepositorySync[];
  repoAccess: RepoAccess[];
  delegationAudits: DelegationAudit[];
  marketingTasks: MarketingTask[];
}
