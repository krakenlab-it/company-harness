import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store/memory-store";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import { slugify } from "@/lib/utils";
import type { ProjectStatus } from "@/lib/types";

export async function GET() {
  try {
    const projects = store.listProjects();
    return NextResponse.json({ projects });
  } catch {
    return jsonError("Failed to list projects");
  }
}

export async function POST(request: NextRequest) {
  try {
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
      stack?: string[];
    }>(request);

    if (!body?.name?.trim()) {
      return jsonError("name is required", 400);
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
      repoUrl: body.repoUrl,
      stack: body.stack ?? [],
    });

    store.addActivity({
      entityType: "project",
      entityId: project.id,
      projectId: project.id,
      action: "created",
      summary: `Created project: ${project.name}`,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch {
    return jsonError("Failed to create project");
  }
}
