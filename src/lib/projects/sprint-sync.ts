import type { Sprint, Ticket } from "@/lib/types";
import { store } from "@/lib/store/memory-store";

/** Derive sprint membership from tickets (source of truth). */
export function ticketsForSprint(sprintId: string): Ticket[] {
  return store.listTickets({ sprintId });
}

export function ticketsForProject(projectId: string): Ticket[] {
  return store.listTickets({ projectId });
}

export function backlogTicketsForProject(projectId: string): Ticket[] {
  return store
    .listTickets({ projectId })
    .filter((t) => !t.sprintId);
}

export type SprintWithTickets = Sprint & {
  tickets: Ticket[];
  ticketCount: number;
};

export function enrichSprintsForProject(projectId: string): SprintWithTickets[] {
  const sprints = store.listSprints(projectId);
  return sprints.map((sprint) => {
    const tickets = ticketsForSprint(sprint.id);
    return {
      ...sprint,
      ticketIds: tickets.map((t) => t.id),
      tickets,
      ticketCount: tickets.length,
    };
  });
}

/** Keep denormalized sprint.ticketIds aligned when ticket.sprintId changes. */
export function syncSprintTicketIds(ticket: Ticket, previousSprintId?: string): void {
  if (previousSprintId && previousSprintId !== ticket.sprintId) {
    const prev = store.getSprint(previousSprintId);
    if (prev) {
      store.updateSprint(previousSprintId, {
        ticketIds: prev.ticketIds.filter((id) => id !== ticket.id),
      });
    }
  }

  if (ticket.sprintId) {
    const sprint = store.getSprint(ticket.sprintId);
    if (sprint && !sprint.ticketIds.includes(ticket.id)) {
      store.updateSprint(ticket.sprintId, {
        ticketIds: [...sprint.ticketIds, ticket.id],
      });
    }
  }
}

export function validateTicketPlacement(input: {
  projectId: string;
  sprintId?: string;
}): string | null {
  if (!input.sprintId) return null;

  const sprint = store.getSprint(input.sprintId);
  if (!sprint) return "Sprint not found";
  if (sprint.projectId !== input.projectId) {
    return "Sprint belongs to a different project";
  }
  return null;
}
