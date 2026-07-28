import { NextResponse } from "next/server";
import {
  requireAuth,
  canManageMarketingTasks,
  AuthError,
} from "@/lib/auth";
import { store } from "@/lib/store/memory-store";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import type { MarketingTaskStatus } from "@/lib/types";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    if (!canManageMarketingTasks(session)) {
      return jsonError("Forbidden: marketing managers only", 403);
    }

    const { id } = await context.params;
    const existing = store.getMarketingTask(id);
    if (!existing) return jsonError("Marketing task not found", 404);

    const body = await parseJsonBody<{
      status?: string;
      assigneeId?: string;
      priority?: string;
      brief?: string;
    }>(request);

    const statuses: MarketingTaskStatus[] = [
      "requested",
      "in_progress",
      "review",
      "done",
      "cancelled",
    ];

    const patch: Parameters<typeof store.updateMarketingTask>[1] = {};
    if (body?.status && statuses.includes(body.status as MarketingTaskStatus)) {
      patch.status = body.status as MarketingTaskStatus;
    }
    if (body?.assigneeId !== undefined) {
      patch.assigneeId = body.assigneeId || undefined;
    }
    if (body?.priority && ["low", "medium", "high"].includes(body.priority)) {
      patch.priority = body.priority as typeof existing.priority;
    }
    if (body?.brief?.trim()) {
      patch.brief = body.brief.trim();
    }

    const updated = store.updateMarketingTask(id, patch);
    if (!updated) return jsonError("Update failed", 500);

    if (patch.status) {
      store.addActivity({
        projectId: updated.projectId,
        entityType: "marketing_task",
        entityId: id,
        action: patch.status,
        summary: `Marketing task ${patch.status}: ${updated.title}`,
        actorId: session.memberId,
      });
    }

    return NextResponse.json({
      task: {
        ...updated,
        requester: store.getMember(updated.requesterId),
        assignee: updated.assigneeId
          ? store.getMember(updated.assigneeId)
          : undefined,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to update marketing task");
  }
}
