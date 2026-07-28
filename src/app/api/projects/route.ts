import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { store } from "@/lib/store/memory-store";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import { slugify } from "@/lib/utils";
import type { ProjectStatus } from "@/lib/types";
import {
  enrichProjectWithRepo,
  resolveProjectRepoLink,
} from "@/lib/projects/link-repo";

export async function GET() {
  try {
    await requireAuth();
    const projects = store.listProjects().map(enrichProjectWithRepo);
    return NextResponse.json({ projects });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to list projects");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await parseJsonBody<{
      name?: string;
      slug?: string;
      description?: string;
      status?: ProjectStatus;
      goals?: string[];
      startDate?: string;
      targetDate?: string;
      progress?: number;
      repoUrl?: string;
      repoId?: string;
      stack?: string[];
    }>(request);

    if (!body?.name?.trim()) {
      return jsonError("name is required", 400);
    }

    const repoLink = resolveProjectRepoLink({
      repoId: body.repoId,
      repoUrl: body.repoUrl,
    });
    if ("error" in repoLink) {
      return jsonError(repoLink.error, 400);
    }

    const now = new Date();
    const defaultTarget = new Date(now.getTime() + 90 * 86_400_000);

    const project = store.createProject({
      name: body.name.trim(),
      slug: body.slug?.trim() || slugify(body.name),
      description: body.description?.trim() ?? "",
      status: body.status ?? "planning",
      goals: body.goals ?? [],
      startDate: body.startDate ?? now.toISOString().slice(0, 10),
      targetDate: body.targetDate ?? defaultTarget.toISOString().slice(0, 10),
      progress: body.progress ?? 0,
      repoId: repoLink.repoId,
      repoUrl: repoLink.repoUrl,
      stack: body.stack ?? [],
    });

    store.addActivity({
      entityType: "project",
      entityId: project.id,
      projectId: project.id,
      action: "created",
      summary: `Created project: ${project.name} → ${repoLink.repoUrl}`,
    });

    return NextResponse.json(
      { project: enrichProjectWithRepo(project) },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to create project");
  }
}
