import { NextResponse } from "next/server";
import {
  requireAuth,
  canManageMarketingTasks,
  AuthError,
} from "@/lib/auth";
import { store } from "@/lib/store/memory-store";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import type { SprintStatus } from "@/lib/types";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await context.params;
    const sprint = store.getSprint(id);
    if (!sprint) return jsonError("Sprint not found", 404);

    const body = await parseJsonBody<{
      status?: string;
      name?: string;
      goal?: string;
      startDate?: string;
      endDate?: string;
    }>(request);

    const statuses: SprintStatus[] = ["planned", "active", "completed"];
    const patch: Parameters<typeof store.updateSprint>[1] = {};

    if (body?.name?.trim()) patch.name = body.name.trim();
    if (body?.goal !== undefined) patch.goal = body.goal.trim();
    if (body?.startDate) patch.startDate = body.startDate;
    if (body?.endDate) patch.endDate = body.endDate;
    if (body?.status && statuses.includes(body.status as SprintStatus)) {
      patch.status = body.status as SprintStatus;
    }

    const updated = store.updateSprint(id, patch);
    if (!updated) return jsonError("Update failed", 500);

    store.addActivity({
      projectId: updated.projectId,
      entityType: "sprint",
      entityId: id,
      action: "updated",
      summary: `Updated sprint: ${updated.name}`,
    });

    return NextResponse.json({ sprint: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to update sprint");
  }
}
