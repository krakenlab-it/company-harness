import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { store } from "@/lib/store/memory-store";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import type { TicketPriority, TicketStatus } from "@/lib/types";
import { validateTicketPlacement } from "@/lib/projects/sprint-sync";

function defaultProjectId(): string | undefined {
  const projects = store.listProjects();
  return (
    projects.find((p) => p.status === "active")?.id ?? projects[0]?.id
  );
}

function mapPriority(priority?: string): TicketPriority {
  if (priority === "urgent") return "critical";
  if (
    priority === "low" ||
    priority === "medium" ||
    priority === "high" ||
    priority === "critical"
  ) {
    return priority;
  }
  return "medium";
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const projectId = request.nextUrl.searchParams.get("projectId") ?? undefined;
    const sprintId = request.nextUrl.searchParams.get("sprintId") ?? undefined;
    const status = request.nextUrl.searchParams.get("status") as
      | TicketStatus
      | null;

    const tickets = store.listTickets({
      projectId,
      sprintId,
      status: status ?? undefined,
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to list tickets");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await parseJsonBody<{
      title?: string;
      description?: string;
      status?: TicketStatus;
      priority?: string;
      projectId?: string;
      sprintId?: string;
      assigneeId?: string;
      labels?: string[];
    }>(request);

    if (!body?.title?.trim()) {
      return jsonError("title is required", 400);
    }

    const projectId = body.projectId ?? defaultProjectId();
    if (!projectId) {
      return jsonError("No project available — create a project first", 400);
    }

    const placementError = validateTicketPlacement({
      projectId,
      sprintId: body.sprintId,
    });
    if (placementError) {
      return jsonError(placementError, 400);
    }

    const ticket = store.createTicket({
      projectId,
      sprintId: body.sprintId,
      title: body.title.trim(),
      description: body.description?.trim() ?? "",
      status: body.status ?? "backlog",
      priority: mapPriority(body.priority),
      assigneeId: body.assigneeId,
      labels: body.labels ?? [],
    });

    store.addActivity({
      entityType: "ticket",
      entityId: ticket.id,
      projectId: ticket.projectId,
      action: "created",
      summary: `Created ticket: ${ticket.title}`,
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to create ticket");
  }
}

/** Supports TicketBoard PATCH to collection route with { id, ...patch } */
export async function PATCH(request: NextRequest) {
  try {
    await requireAuth();
    const body = await parseJsonBody<{
      id?: string;
      status?: TicketStatus;
      priority?: string;
      title?: string;
      description?: string;
      projectId?: string;
      sprintId?: string | null;
      assigneeId?: string;
      labels?: string[];
    }>(request);

    if (!body?.id) {
      return jsonError("id is required", 400);
    }

    const existing = store.getTicket(body.id);
    if (!existing) {
      return jsonError("Ticket not found", 404);
    }

    const nextProjectId = body.projectId ?? existing.projectId;
    const nextSprintId =
      body.sprintId === "" || body.sprintId === null
        ? undefined
        : body.sprintId !== undefined
          ? body.sprintId
          : existing.sprintId;

    const placementError = validateTicketPlacement({
      projectId: nextProjectId,
      sprintId: nextSprintId,
    });
    if (placementError) {
      return jsonError(placementError, 400);
    }

    const patch: Record<string, unknown> = { ...body };
    delete patch.id;
    if (body.sprintId === "" || body.sprintId === null) {
      patch.sprintId = undefined;
    }
    if (body.priority) {
      patch.priority = mapPriority(body.priority);
    }

    const ticket = store.updateTicket(body.id, patch);
    if (!ticket) {
      return jsonError("Ticket not found", 404);
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to update ticket");
  }
}
