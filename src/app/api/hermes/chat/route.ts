import { NextRequest, NextResponse } from "next/server";
import {
  isHermesConfigured,
  runHermes,
  buildHarnessContext,
  type HermesMessageInput,
} from "@/lib/hermes/agent";
import { isCursorCommand } from "@/lib/hermes/cursor-command";
import { handleHermesCursorCommand } from "@/lib/hermes/handle-cursor-delegation";
import { requireAuth, getVisibleRepos, AuthError } from "@/lib/auth";
import { store } from "@/lib/store/memory-store";
import { syncRunningAgentJobs } from "@/lib/cursor/client";
import { getHermesGroqModel } from "@/lib/hermes/config";
import { getHermesConnectionStatus } from "@/lib/hermes/status";
import {
  checkHermesRateLimit,
} from "@/lib/hermes/rate-limit";
import { getHermesRateLimitRpm } from "@/lib/hermes/config";
import { jsonError, parseJsonBody } from "@/lib/api/response";

export const maxDuration = 120;

function toChatMessages() {
  return store
    .listHermesMessages()
    .filter((m) => m.channel === "in_app" && m.role !== "system")
    .map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      contextType: m.contextType,
      contextId: m.contextId,
      createdAt: m.createdAt,
    }));
}

function trackedAgentJobs() {
  const messageJobIds = new Set(
    store
      .listHermesMessages()
      .filter((m) => m.contextType === "agent_job" && m.contextId)
      .map((m) => m.contextId!),
  );

  return store
    .listAgentJobs()
    .filter((j) => messageJobIds.has(j.id))
    .map((j) => ({
      id: j.id,
      title: j.title,
      status: j.status,
      type: j.type,
      repo: j.repo,
      prUrl: j.prUrl,
      cursorAgentId: j.cursorAgentId,
      resultSummary: j.resultSummary,
      updatedAt: j.updatedAt,
    }));
}

async function buildContextPayload(memberId: string) {
  const visibleRepos = getVisibleRepos(memberId);
  const openTickets = store
    .listTickets()
    .filter((t) => t.status !== "done" && t.status !== "backlog");
  const activeAgents = store
    .listAgentJobs()
    .filter((j) => j.status === "running" || j.status === "queued");

  return {
    repos: visibleRepos.length,
    openTickets: openTickets.length,
    activeAgents: activeAgents.length,
  };
}

export async function GET() {
  try {
    const session = await requireAuth();
    await syncRunningAgentJobs();

    const messages = toChatMessages();
    const context = await buildContextPayload(session.memberId);

    const connection = getHermesConnectionStatus();

    return NextResponse.json({
      messages,
      trackedJobs: trackedAgentJobs(),
      context,
      status: {
        configured: connection.configured,
        offline: connection.offline,
        groqModel: connection.groqModel ?? getHermesGroqModel(),
        hint: connection.hint,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to load Hermes messages");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    await syncRunningAgentJobs();

    const body = await parseJsonBody<{
      messages?: HermesMessageInput[];
      message?: string;
      repo?: string;
      context?: {
        projectId?: string;
        ticketId?: string;
        contactId?: string;
      };
      channel?: string;
    }>(request);

    if (!body) {
      return jsonError("Invalid JSON body", 400);
    }

    const scopedRepo = body.repo?.trim() || null;
    let userText = "";

    if (body.message?.trim()) {
      userText = body.message.trim();
    } else if (body.messages?.length) {
      const last = body.messages.filter((m) => m.role === "user").pop();
      userText = last?.content?.trim() ?? "";
    } else {
      return jsonError("messages or message is required", 400);
    }

    const rate = checkHermesRateLimit(session.memberId, getHermesRateLimitRpm());
    if (!rate.allowed) {
      return jsonError(
        `Hermes rate limit — try again in ${rate.retryAfterSec}s`,
        429,
      );
    }

    if (isCursorCommand(userText)) {
      const delegation = await handleHermesCursorCommand(
        session,
        userText,
        scopedRepo,
      );

      const context = await buildContextPayload(session.memberId);
      const connection = getHermesConnectionStatus();

      return NextResponse.json({
        reply: delegation.text,
        message: delegation.text,
        content: delegation.text,
        delegation: delegation.job
          ? {
              id: delegation.job.id,
              status: delegation.job.status,
              cursorAgentId: delegation.job.cursorAgentId,
              prUrl: delegation.job.prUrl,
            }
          : undefined,
        error: delegation.error,
        offline: false,
        context: {
          ...context,
          snapshot: buildHarnessContext(session.memberId).slice(0, 500),
        },
        status: {
          configured: connection.configured,
          offline: connection.offline,
          groqModel: connection.groqModel,
          hint: connection.hint,
        },
        messages: toChatMessages(),
        trackedJobs: trackedAgentJobs(),
      });
    }

    let messages: HermesMessageInput[];

    if (body.messages?.length) {
      messages = body.messages;
    } else {
      const history = store
        .listHermesMessages()
        .filter((m) => m.channel === "in_app" && m.role !== "system")
        .map((m) => ({
          role: m.role as HermesMessageInput["role"],
          content: m.content,
        }));
      messages = [...history, { role: "user" as const, content: userText }];
    }

    const result = await runHermes({
      messages,
      context: body.context,
      memberId: session.memberId,
    });

    const context = await buildContextPayload(session.memberId);
    const connection = getHermesConnectionStatus();

    return NextResponse.json({
      reply: result.text,
      message: result.text,
      content: result.text,
      toolResults: result.toolResults,
      steps: result.steps,
      offline: result.offline,
      context: {
        ...context,
        snapshot: buildHarnessContext(session.memberId).slice(0, 500),
      },
      status: {
        configured: connection.configured,
        offline: result.offline ?? connection.offline,
        groqModel: connection.groqModel ?? getHermesGroqModel(),
        hint: connection.hint,
      },
      messages: toChatMessages(),
      trackedJobs: trackedAgentJobs(),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    console.error("[hermes/chat]", error);
    return jsonError("Failed to run Hermes");
  }
}
