import type {
  ActivityEvent,
  CrmContact,
  CrmDeal,
  CursorAgentJob,
  GcpHealthCheck,
  DelegationAudit,
  GitHubRepositorySync,
  GoogleCalendarEventSummary,
  GoogleGmailThreadSummary,
  HarnessSnapshot,
  HermesMessage,
  IntegrationConnection,
  IntegrationProvider,
  IntegrationStatus,
  OpenRouterUsageSnapshot,
  Project,
  ProjectAssignment,
  ProviderCost,
  RepoAccess,
  Sprint,
  StackDependency,
  TeamBudget,
  TeamInvite,
  TeamMember,
  TeamRepo,
  Ticket,
  MarketingTask,
  TriggerJobRun,
} from "@/lib/types";
import { uid } from "@/lib/utils";
import { seedData } from "@/lib/store/seed";
import { buildDefaultConnections } from "@/lib/integrations/config";

type EntityWithId = { id: string };

function clone<T>(value: T): T {
  return structuredClone(value);
}

class MemoryStore {
  private state: HarnessSnapshot;

  constructor() {
    this.state = clone(seedData);
  }

  reset(): void {
    this.state = clone(seedData);
  }

  getSnapshot(): HarnessSnapshot {
    return clone(this.state);
  }

  private list<T extends EntityWithId>(collection: T[]): T[] {
    return clone(collection);
  }

  private getById<T extends EntityWithId>(
    collection: T[],
    id: string,
  ): T | undefined {
    return clone(collection.find((item) => item.id === id));
  }

  private create<T extends EntityWithId>(
    collection: T[],
    item: T,
  ): T {
    collection.push(item);
    return clone(item);
  }

  private update<T extends EntityWithId>(
    collection: T[],
    id: string,
    patch: Partial<T>,
  ): T | undefined {
    const index = collection.findIndex((item) => item.id === id);
    if (index === -1) return undefined;
    collection[index] = { ...collection[index], ...patch };
    return clone(collection[index]);
  }

  listProjects(): Project[] {
    return this.list(this.state.projects);
  }

  getProject(id: string): Project | undefined {
    return this.getById(this.state.projects, id);
  }

  createProject(
    input: Omit<Project, "id" | "createdAt" | "updatedAt">,
  ): Project {
    const now = new Date().toISOString();
    const project: Project = {
      ...input,
      id: uid("proj"),
      createdAt: now,
      updatedAt: now,
    };
    return this.create(this.state.projects, project);
  }

  updateProject(id: string, patch: Partial<Project>): Project | undefined {
    const updated = this.update(this.state.projects, id, {
      ...patch,
      updatedAt: new Date().toISOString(),
    });
    return updated;
  }

  listSprints(projectId?: string): Sprint[] {
    const sprints = this.list(this.state.sprints);
    return projectId
      ? sprints.filter((s) => s.projectId === projectId)
      : sprints;
  }

  getSprint(id: string): Sprint | undefined {
    return this.getById(this.state.sprints, id);
  }

  createSprint(input: Omit<Sprint, "id">): Sprint {
    const sprint: Sprint = { ...input, id: uid("sprint") };
    return this.create(this.state.sprints, sprint);
  }

  updateSprint(id: string, patch: Partial<Sprint>): Sprint | undefined {
    return this.update(this.state.sprints, id, patch);
  }

  listTickets(filters?: {
    projectId?: string;
    sprintId?: string;
    status?: Ticket["status"];
  }): Ticket[] {
    let tickets = this.list(this.state.tickets);
    if (filters?.projectId) {
      tickets = tickets.filter((t) => t.projectId === filters.projectId);
    }
    if (filters?.sprintId) {
      tickets = tickets.filter((t) => t.sprintId === filters.sprintId);
    }
    if (filters?.status) {
      tickets = tickets.filter((t) => t.status === filters.status);
    }
    return tickets;
  }

  getTicket(id: string): Ticket | undefined {
    return this.getById(this.state.tickets, id);
  }

  createTicket(
    input: Omit<Ticket, "id" | "createdAt" | "updatedAt">,
  ): Ticket {
    const now = new Date().toISOString();
    const ticket: Ticket = {
      ...input,
      id: uid("ticket"),
      createdAt: now,
      updatedAt: now,
    };
    const created = this.create(this.state.tickets, ticket);
    this.syncSprintMembership(created);
    return created;
  }

  updateTicket(id: string, patch: Partial<Ticket>): Ticket | undefined {
    const existing = this.state.tickets.find((t) => t.id === id);
    const previousSprintId = existing?.sprintId;

    const updated = this.update(this.state.tickets, id, {
      ...patch,
      updatedAt: new Date().toISOString(),
    });

    if (updated) {
      this.syncSprintMembership(updated, previousSprintId);
    }
    return updated;
  }

  private syncSprintMembership(ticket: Ticket, previousSprintId?: string): void {
    if (previousSprintId && previousSprintId !== ticket.sprintId) {
      const prev = this.state.sprints.find((s) => s.id === previousSprintId);
      if (prev) {
        prev.ticketIds = prev.ticketIds.filter((tid) => tid !== ticket.id);
      }
    }

    if (ticket.sprintId) {
      const sprint = this.state.sprints.find((s) => s.id === ticket.sprintId);
      if (sprint && !sprint.ticketIds.includes(ticket.id)) {
        sprint.ticketIds.push(ticket.id);
      }
    }
  }

  listCosts(): ProviderCost[] {
    return this.list(this.state.costs);
  }

  getCost(id: string): ProviderCost | undefined {
    return this.getById(this.state.costs, id);
  }

  createCost(input: Omit<ProviderCost, "id" | "updatedAt">): ProviderCost {
    const cost: ProviderCost = {
      ...input,
      id: uid("cost"),
      updatedAt: new Date().toISOString(),
    };
    return this.create(this.state.costs, cost);
  }

  updateCost(id: string, patch: Partial<ProviderCost>): ProviderCost | undefined {
    return this.update(this.state.costs, id, {
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  }

  listStack(projectId?: string): StackDependency[] {
    const stack = this.list(this.state.stack);
    return projectId
      ? stack.filter((s) => s.projectId === projectId)
      : stack;
  }

  getStackItem(id: string): StackDependency | undefined {
    return this.getById(this.state.stack, id);
  }

  createStackItem(input: Omit<StackDependency, "id">): StackDependency {
    const item: StackDependency = { ...input, id: uid("stack") };
    return this.create(this.state.stack, item);
  }

  updateStackItem(
    id: string,
    patch: Partial<StackDependency>,
  ): StackDependency | undefined {
    return this.update(this.state.stack, id, patch);
  }

  listAgentJobs(): CursorAgentJob[] {
    return this.list(this.state.agents);
  }

  getAgentJob(id: string): CursorAgentJob | undefined {
    return this.getById(this.state.agents, id);
  }

  createAgentJob(
    input: Omit<CursorAgentJob, "id" | "createdAt" | "updatedAt">,
  ): CursorAgentJob {
    const now = new Date().toISOString();
    const job: CursorAgentJob = {
      ...input,
      id: uid("agent"),
      createdAt: now,
      updatedAt: now,
    };
    return this.create(this.state.agents, job);
  }

  updateAgentJob(
    id: string,
    patch: Partial<CursorAgentJob>,
  ): CursorAgentJob | undefined {
    return this.update(this.state.agents, id, {
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  }

  listContacts(): CrmContact[] {
    return this.list(this.state.contacts);
  }

  getContact(id: string): CrmContact | undefined {
    return this.getById(this.state.contacts, id);
  }

  createContact(
    input: Omit<CrmContact, "id" | "createdAt">,
  ): CrmContact {
    const contact: CrmContact = {
      ...input,
      id: uid("crm"),
      createdAt: new Date().toISOString(),
    };
    return this.create(this.state.contacts, contact);
  }

  updateContact(id: string, patch: Partial<CrmContact>): CrmContact | undefined {
    return this.update(this.state.contacts, id, patch);
  }

  listDeals(contactId?: string): CrmDeal[] {
    const deals = this.list(this.state.deals);
    return contactId
      ? deals.filter((d) => d.contactId === contactId)
      : deals;
  }

  getDeal(id: string): CrmDeal | undefined {
    return this.getById(this.state.deals, id);
  }

  createDeal(input: Omit<CrmDeal, "id" | "createdAt">): CrmDeal {
    const deal: CrmDeal = {
      ...input,
      id: uid("deal"),
      createdAt: new Date().toISOString(),
    };
    return this.create(this.state.deals, deal);
  }

  updateDeal(id: string, patch: Partial<CrmDeal>): CrmDeal | undefined {
    return this.update(this.state.deals, id, patch);
  }

  listMembers(): TeamMember[] {
    return this.list(this.state.members);
  }

  getMember(id: string): TeamMember | undefined {
    return this.getById(this.state.members, id);
  }

  createMember(
    input: Omit<TeamMember, "id" | "createdAt">,
  ): TeamMember {
    const member: TeamMember = {
      ...input,
      id: uid("member"),
      createdAt: new Date().toISOString(),
    };
    return this.create(this.state.members, member);
  }

  updateMember(id: string, patch: Partial<TeamMember>): TeamMember | undefined {
    return this.update(this.state.members, id, patch);
  }

  listRepos(): TeamRepo[] {
    return this.list(this.state.repos);
  }

  getRepo(id: string): TeamRepo | undefined {
    return this.getById(this.state.repos, id);
  }

  createRepo(input: Omit<TeamRepo, "id">): TeamRepo {
    const repo: TeamRepo = { ...input, id: uid("repo") };
    return this.create(this.state.repos, repo);
  }

  updateRepo(id: string, patch: Partial<TeamRepo>): TeamRepo | undefined {
    return this.update(this.state.repos, id, patch);
  }

  listBudgets(): TeamBudget[] {
    return this.list(this.state.budgets);
  }

  getBudget(id: string): TeamBudget | undefined {
    return this.getById(this.state.budgets, id);
  }

  createBudget(input: Omit<TeamBudget, "id">): TeamBudget {
    const budget: TeamBudget = { ...input, id: uid("budget") };
    return this.create(this.state.budgets, budget);
  }

  updateBudget(id: string, patch: Partial<TeamBudget>): TeamBudget | undefined {
    return this.update(this.state.budgets, id, patch);
  }

  addActivity(event: Omit<ActivityEvent, "id" | "createdAt">): ActivityEvent {
    const activity: ActivityEvent = {
      ...event,
      id: uid("act"),
      createdAt: new Date().toISOString(),
    };
    this.state.activities.unshift(activity);
    return clone(activity);
  }

  addHermesMessage(
    message: Omit<HermesMessage, "id" | "createdAt">,
  ): HermesMessage {
    const entry: HermesMessage = {
      ...message,
      id: uid("msg"),
      createdAt: new Date().toISOString(),
    };
    this.state.hermesMessages.push(entry);
    return clone(entry);
  }

  listHermesMessages(limit?: number): HermesMessage[] {
    const messages = this.list(this.state.hermesMessages);
    return limit ? messages.slice(-limit) : messages;
  }

  listIntegrationConnections(): IntegrationConnection[] {
    return this.list(this.state.integrationConnections);
  }

  setIntegrationStatus(
    provider: IntegrationProvider,
    status: IntegrationStatus,
    lastError?: string,
    metadataPatch?: Record<string, unknown>,
  ): IntegrationConnection | undefined {
    const index = this.state.integrationConnections.findIndex(
      (c) => c.provider === provider,
    );
    if (index === -1) {
      const conn: IntegrationConnection = {
        id: uid("conn"),
        provider,
        label: provider,
        status,
        configured: status === "connected",
        lastSyncAt: status === "connected" ? new Date().toISOString() : undefined,
        lastError,
        metadata: metadataPatch,
      };
      this.state.integrationConnections.push(conn);
      return clone(conn);
    }

    const existing = this.state.integrationConnections[index];
    this.state.integrationConnections[index] = {
      ...existing,
      status,
      configured: status !== "disconnected",
      lastSyncAt: status === "connected" ? new Date().toISOString() : existing.lastSyncAt,
      lastError: lastError ?? (status === "connected" ? undefined : existing.lastError),
      metadata: metadataPatch
        ? { ...existing.metadata, ...metadataPatch }
        : existing.metadata,
    };
    return clone(this.state.integrationConnections[index]);
  }

  refreshIntegrationConnectionsFromEnv(): IntegrationConnection[] {
    this.state.integrationConnections = buildDefaultConnections();
    return this.listIntegrationConnections();
  }

  recordOpenRouterUsage(
    snapshot: Omit<OpenRouterUsageSnapshot, "id" | "recordedAt">,
  ): OpenRouterUsageSnapshot {
    const entry: OpenRouterUsageSnapshot = {
      ...snapshot,
      id: uid("orusage"),
      recordedAt: new Date().toISOString(),
    };
    this.state.openRouterUsage.unshift(entry);
    return clone(entry);
  }

  listOpenRouterUsage(limit = 30): OpenRouterUsageSnapshot[] {
    return this.list(this.state.openRouterUsage).slice(0, limit);
  }

  replaceTriggerRuns(runs: TriggerJobRun[]): TriggerJobRun[] {
    this.state.triggerRuns = clone(runs);
    return this.listTriggerRuns();
  }

  listTriggerRuns(limit = 50): TriggerJobRun[] {
    return this.list(this.state.triggerRuns).slice(0, limit);
  }

  replaceGoogleCalendarEvents(
    events: GoogleCalendarEventSummary[],
  ): GoogleCalendarEventSummary[] {
    this.state.googleCalendarEvents = clone(events);
    return this.listGoogleCalendarEvents();
  }

  listGoogleCalendarEvents(): GoogleCalendarEventSummary[] {
    return this.list(this.state.googleCalendarEvents);
  }

  replaceGoogleGmailThreads(
    threads: GoogleGmailThreadSummary[],
  ): GoogleGmailThreadSummary[] {
    this.state.googleGmailThreads = clone(threads);
    return this.listGoogleGmailThreads();
  }

  listGoogleGmailThreads(): GoogleGmailThreadSummary[] {
    return this.list(this.state.googleGmailThreads);
  }

  replaceGcpHealthChecks(checks: GcpHealthCheck[]): GcpHealthCheck[] {
    this.state.gcpHealthChecks = clone(checks);
    return this.listGcpHealthChecks();
  }

  listGcpHealthChecks(): GcpHealthCheck[] {
    return this.list(this.state.gcpHealthChecks);
  }

  replaceGitHubRepositories(repos: GitHubRepositorySync[]): GitHubRepositorySync[] {
    this.state.githubRepositories = clone(repos);
    return this.listGitHubRepositories();
  }

  replaceStackForRepo(repoId: string, items: StackDependency[]): StackDependency[] {
    this.state.stack = this.state.stack.filter((s) => s.repoId !== repoId);
    this.state.stack.push(...items);
    return this.listStack().filter((s) => s.repoId === repoId);
  }

  listGitHubRepositories(): GitHubRepositorySync[] {
    return this.list(this.state.githubRepositories);
  }

  listTeamInvites(status?: TeamInvite["status"]): TeamInvite[] {
    const invites = this.list(this.state.teamInvites);
    return status ? invites.filter((i) => i.status === status) : invites;
  }

  getTeamInviteByToken(token: string): TeamInvite | undefined {
    return clone(
      this.state.teamInvites.find((i) => i.token === token),
    );
  }

  createTeamInvite(
    input: Omit<TeamInvite, "id" | "token" | "status" | "createdAt">,
  ): TeamInvite {
    const invite: TeamInvite = {
      ...input,
      id: uid("invite"),
      token: crypto.randomUUID(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    return this.create(this.state.teamInvites, invite);
  }

  updateTeamInvite(
    id: string,
    patch: Partial<TeamInvite>,
  ): TeamInvite | undefined {
    return this.update(this.state.teamInvites, id, patch);
  }

  listProjectAssignments(filters?: {
    projectId?: string;
    email?: string;
  }): ProjectAssignment[] {
    let assignments = this.list(this.state.projectAssignments);
    if (filters?.projectId) {
      assignments = assignments.filter((a) => a.projectId === filters.projectId);
    }
    if (filters?.email) {
      assignments = assignments.filter(
        (a) => a.email.toLowerCase() === filters.email!.toLowerCase(),
      );
    }
    return assignments;
  }

  createProjectAssignment(
    input: Omit<ProjectAssignment, "id" | "assignedAt">,
  ): ProjectAssignment {
    const assignment: ProjectAssignment = {
      ...input,
      id: uid("assign"),
      assignedAt: new Date().toISOString(),
    };
    return this.create(this.state.projectAssignments, assignment);
  }

  getMemberByEmail(email: string): TeamMember | undefined {
    return clone(
      this.state.members.find(
        (m) => m.email.toLowerCase() === email.toLowerCase(),
      ),
    );
  }

  findRepoByUrl(url: string): TeamRepo | undefined {
    const norm = url.replace(/\.git$/, "").replace(/\/$/, "").toLowerCase();
    return clone(
      this.state.repos.find(
        (r) =>
          r.url.replace(/\.git$/, "").replace(/\/$/, "").toLowerCase() === norm,
      ),
    );
  }

  listRepoAccess(): RepoAccess[] {
    return this.list(this.state.repoAccess);
  }

  listRepoAccessForMember(memberId: string): RepoAccess[] {
    return this.list(this.state.repoAccess).filter(
      (a) => a.memberId === memberId,
    );
  }

  listRepoAccessForRepo(repoId: string): RepoAccess[] {
    return this.list(this.state.repoAccess).filter((a) => a.repoId === repoId);
  }

  getRepoAccess(memberId: string, repoId: string): RepoAccess | undefined {
    return clone(
      this.state.repoAccess.find(
        (a) => a.memberId === memberId && a.repoId === repoId,
      ),
    );
  }

  setRepoAccess(input: {
    memberId: string;
    repoId: string;
    actions: RepoAccess["actions"];
    grantedBy?: string;
  }): RepoAccess {
    const existing = this.state.repoAccess.findIndex(
      (a) => a.memberId === input.memberId && a.repoId === input.repoId,
    );
    if (existing >= 0) {
      this.state.repoAccess[existing] = {
        ...this.state.repoAccess[existing],
        actions: input.actions,
        grantedBy: input.grantedBy,
        grantedAt: new Date().toISOString(),
      };
      return clone(this.state.repoAccess[existing]);
    }
    const entry: RepoAccess = {
      id: uid("access"),
      memberId: input.memberId,
      repoId: input.repoId,
      actions: input.actions,
      grantedBy: input.grantedBy,
      grantedAt: new Date().toISOString(),
    };
    return this.create(this.state.repoAccess, entry);
  }

  createDelegationAudit(
    input: Omit<DelegationAudit, "id" | "createdAt">,
  ): DelegationAudit {
    const entry: DelegationAudit = {
      ...input,
      id: uid("audit"),
      createdAt: new Date().toISOString(),
    };
    return this.create(this.state.delegationAudits, entry);
  }

  listDelegationAudits(limit = 50): DelegationAudit[] {
    return this.list(this.state.delegationAudits).slice(0, limit);
  }

  updateDelegationAudit(
    id: string,
    patch: Partial<Pick<DelegationAudit, "status" | "prUrl">>,
  ): DelegationAudit | undefined {
    return this.update<DelegationAudit>(
      this.state.delegationAudits,
      id,
      patch,
    );
  }

  listMarketingTasks(filters?: {
    status?: MarketingTask["status"];
    assigneeId?: string;
    requesterId?: string;
  }): MarketingTask[] {
    let tasks = this.list(this.state.marketingTasks);
    if (filters?.status) {
      tasks = tasks.filter((t) => t.status === filters.status);
    }
    if (filters?.assigneeId) {
      tasks = tasks.filter((t) => t.assigneeId === filters.assigneeId);
    }
    if (filters?.requesterId) {
      tasks = tasks.filter((t) => t.requesterId === filters.requesterId);
    }
    return tasks.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  getMarketingTask(id: string): MarketingTask | undefined {
    return this.getById(this.state.marketingTasks, id);
  }

  createMarketingTask(
    input: Omit<MarketingTask, "id" | "createdAt" | "updatedAt">,
  ): MarketingTask {
    const now = new Date().toISOString();
    const task: MarketingTask = {
      ...input,
      id: uid("mkt"),
      createdAt: now,
      updatedAt: now,
    };
    return this.create(this.state.marketingTasks, task);
  }

  updateMarketingTask(
    id: string,
    patch: Partial<MarketingTask>,
  ): MarketingTask | undefined {
    return this.update(this.state.marketingTasks, id, {
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  }
}

export const store = new MemoryStore();
