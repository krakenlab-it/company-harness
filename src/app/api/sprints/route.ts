import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store/memory-store";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import type { SprintStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId") ?? undefined;
    const sprints = store.listSprints(projectId);
    return NextResponse.json({ sprints });
  } catch {
    return jsonError("Failed to list sprints");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<{
      projectId?: string;
      name?: string;
      goal?: string;
      startDate?: string;
      endDate?: string;
      status?: SprintStatus;
      ticketIds?: string[];
    }>(request);

    if (!body?.projectId) {
      return jsonError("projectId is required", 400);
    }
    if (!body.name?.trim()) {
      return jsonError("name is required", 400);
    }

    const project = store.getProject(body.projectId);
    if (!project) {
      return jsonError("Project not found", 404);
    }

    const now = new Date();
    const endDefault = new Date(now.getTime() + 14 * 86_400_000);

    const sprint = store.createSprint({
      projectId: body.projectId,
      name: body.name.trim(),
      goal: body.goal?.trim() ?? "",
      startDate: body.startDate ?? now.toISOString().slice(0, 10),
      endDate: body.endDate ?? endDefault.toISOString().slice(0, 10),
      status: body.status ?? "planned",
      ticketIds: body.ticketIds ?? [],
    });

    store.addActivity({
      entityType: "sprint",
      entityId: sprint.id,
      projectId: sprint.projectId,
      action: "created",
      summary: `Created sprint: ${sprint.name}`,
    });

    return NextResponse.json({ sprint }, { status: 201 });
  } catch {
    return jsonError("Failed to create sprint");
  }
}
