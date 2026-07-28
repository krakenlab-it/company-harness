import type {
  ActivityEvent,
  CrmContact,
  CrmDeal,
  CursorAgentJob,
  HarnessSnapshot,
  HermesMessage,
  Project,
  ProviderCost,
  Sprint,
  StackDependency,
  TeamBudget,
  TeamMember,
  TeamRepo,
  Ticket,
} from "@/lib/types";
import { uid } from "@/lib/utils";
import { seedData } from "@/lib/store/seed";

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
    return this.create(this.state.tickets, ticket);
  }

  updateTicket(id: string, patch: Partial<Ticket>): Ticket | undefined {
    return this.update(this.state.tickets, id, {
      ...patch,
      updatedAt: new Date().toISOString(),
    });
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
}

export const store = new MemoryStore();
