import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { store } from "@/lib/store/memory-store";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import type { TicketPriority, TicketStatus } from "@/lib/types";

function mapPriority(priority?: string): TicketPriority | undefined {
  if (!priority) return undefined;
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;
    const existing = store.getTicket(id);

    if (!existing) {
      return jsonError("Ticket not found", 404);
    }

    const body = await parseJsonBody<{
      status?: TicketStatus;
      priority?: string;
      title?: string;
      description?: string;
      sprintId?: string;
      assigneeId?: string;
      labels?: string[];
      hermesNotes?: string;
    }>(request);

    if (!body) {
      return jsonError("Invalid JSON body", 400);
    }

    const patch = {
      ...body,
      priority: mapPriority(body.priority),
    };

    const ticket = store.updateTicket(id, patch);
    if (!ticket) {
      return jsonError("Failed to update ticket");
    }

    if (body.status && body.status !== existing.status) {
      store.addActivity({
        entityType: "ticket",
        entityId: ticket.id,
        projectId: ticket.projectId,
        action: "status_changed",
        summary: `Ticket "${ticket.title}" moved to ${body.status}`,
      });
    }

    return NextResponse.json({ ticket });
  } catch {
    return jsonError("Failed to update ticket");
  }
}
