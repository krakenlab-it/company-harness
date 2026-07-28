import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { store } from "@/lib/store/memory-store";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import type { Project } from "@/lib/types";

function findProject(idOrSlug: string): Project | undefined {
  const byId = store.getProject(idOrSlug);
  if (byId) return byId;
  return store.listProjects().find((p) => p.slug === idOrSlug);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;
    const project = findProject(id);

    if (!project) {
      return jsonError("Project not found", 404);
    }

    const sprints = store.listSprints(project.id);
    const tickets = store.listTickets({ projectId: project.id });

    return NextResponse.json({
      project,
      sprints,
      tickets,
      gantt: { sprints, tickets },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to get project");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;
    const project = findProject(id);

    if (!project) {
      return jsonError("Project not found", 404);
    }

    const body = await parseJsonBody<Partial<Project>>(request);
    if (!body) {
      return jsonError("Invalid JSON body", 400);
    }

    const { id: _id, createdAt: _created, ...patch } = body;
    const updated = store.updateProject(project.id, patch);

    if (!updated) {
      return jsonError("Failed to update project");
    }

    store.addActivity({
      entityType: "project",
      entityId: updated.id,
      projectId: updated.id,
      action: "updated",
      summary: `Updated project: ${updated.name}`,
    });

    return NextResponse.json({ project: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to update project");
  }
}
