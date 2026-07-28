import { NextResponse } from "next/server";
import {
  requireAuth,
  canAccessMarketing,
  canRequestMarketingTasks,
  AuthError,
} from "@/lib/auth";
import { createMarketingTaskFromInput } from "@/lib/marketing/handle-marketing-request";
import { store } from "@/lib/store/memory-store";
import { jsonError, parseJsonBody } from "@/lib/api/response";
import type { MarketingTaskCategory, MarketingTaskPriority } from "@/lib/types";

import type { MarketingTaskStatus } from "@/lib/types";

function mapTask(task: ReturnType<typeof store.getMarketingTask>) {
  if (!task) return task;
  return {
    ...task,
    requester: task.requesterId
      ? store.getMember(task.requesterId)
      : undefined,
    assignee: task.assigneeId ? store.getMember(task.assigneeId) : undefined,
    project: task.projectId ? store.getProject(task.projectId) : undefined,
  };
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    if (!canAccessMarketing(session)) {
      return jsonError("Forbidden: marketing access required", 403);
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const validStatuses: MarketingTaskStatus[] = [
      "requested",
      "in_progress",
      "review",
      "done",
      "cancelled",
    ];

    const tasks = store
      .listMarketingTasks(
        statusParam && validStatuses.includes(statusParam as MarketingTaskStatus)
          ? { status: statusParam as MarketingTaskStatus }
          : undefined,
      )
      .map((t) => mapTask(t));

    const openCount = store
      .listMarketingTasks()
      .filter((t) => t.status !== "done" && t.status !== "cancelled").length;

    return NextResponse.json({
      tasks,
      openCount,
      canRequest: canRequestMarketingTasks(session),
      canManage:
        session.role === "admin" || session.role === "marketing",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to list marketing tasks");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    if (!canRequestMarketingTasks(session)) {
      return jsonError("Forbidden: cannot request marketing tasks", 403);
    }

    const body = await parseJsonBody<{
      category?: string;
      title?: string;
      brief?: string;
      projectId?: string;
      targetUrl?: string;
      priority?: string;
    }>(request);

    if (!body?.title?.trim()) {
      return jsonError("title is required", 400);
    }

    const categories: MarketingTaskCategory[] = [
      "landing_page",
      "ui_redesign",
      "brand_copy",
      "social_campaign",
      "email_campaign",
      "other",
    ];
    const category = categories.includes(body.category as MarketingTaskCategory)
      ? (body.category as MarketingTaskCategory)
      : "other";

    const priorities: MarketingTaskPriority[] = ["low", "medium", "high"];
    const priority = priorities.includes(body.priority as MarketingTaskPriority)
      ? (body.priority as MarketingTaskPriority)
      : undefined;

    const task = createMarketingTaskFromInput({
      session,
      category,
      title: body.title.trim(),
      brief: body.brief?.trim() ?? body.title.trim(),
      projectId: body.projectId?.trim(),
      targetUrl: body.targetUrl?.trim(),
      priority,
      source: "marketing_ui",
    });

    return NextResponse.json({ task: mapTask(task) }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to create marketing task");
  }
}
