import { NextRequest, NextResponse } from "next/server";
import {
  isHermesConfigured,
  runHermes,
  buildHarnessContext,
  type HermesMessageInput,
} from "@/lib/hermes/agent";
import { requireAuth, getVisibleRepos, AuthError } from "@/lib/auth";
import { store } from "@/lib/store/memory-store";
import { jsonError, parseJsonBody } from "@/lib/api/response";

function toChatMessages() {
  return store
    .listHermesMessages()
    .filter((m) => m.channel === "in_app" && m.role !== "system")
    .map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      createdAt: m.createdAt,
    }));
}

export async function GET() {
  try {
    const session = await requireAuth();
    const visibleRepos = getVisibleRepos(session.memberId);
    const openTickets = store
      .listTickets()
      .filter((t) => t.status !== "done" && t.status !== "backlog");
    const activeAgents = store
      .listAgentJobs()
      .filter((j) => j.status === "running" || j.status === "queued");

    const messages = toChatMessages();
    return NextResponse.json({
      messages,
      context: {
        repos: visibleRepos.length,
        openTickets: openTickets.length,
        activeAgents: activeAgents.length,
      },
      status: {
        configured: isHermesConfigured(),
        offline: false,
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
    const body = await parseJsonBody<{
      messages?: HermesMessageInput[];
      message?: string;
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

    let messages: HermesMessageInput[];

    if (body.messages?.length) {
      messages = body.messages;
    } else if (body.message?.trim()) {
      const history = store
        .listHermesMessages()
        .filter((m) => m.channel === "in_app" && m.role !== "system")
        .map((m) => ({
          role: m.role as HermesMessageInput["role"],
          content: m.content,
        }));
      messages = [
        ...history,
        { role: "user" as const, content: body.message.trim() },
      ];
    } else {
      return jsonError("messages or message is required", 400);
    }

    const result = await runHermes({
      messages,
      context: body.context,
      memberId: session.memberId,
    });

    const visibleRepos = getVisibleRepos(session.memberId);
    const openTickets = store
      .listTickets()
      .filter((t) => t.status !== "done" && t.status !== "backlog");
    const activeAgents = store
      .listAgentJobs()
      .filter((j) => j.status === "running" || j.status === "queued");

    return NextResponse.json({
      reply: result.text,
      message: result.text,
      content: result.text,
      toolResults: result.toolResults,
      offline: result.offline,
      context: {
        repos: visibleRepos.length,
        openTickets: openTickets.length,
        activeAgents: activeAgents.length,
        snapshot: buildHarnessContext(session.memberId).slice(0, 500),
      },
      status: {
        configured: isHermesConfigured(),
        offline: false,
      },
      messages: toChatMessages(),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    console.error("[hermes/chat]", error);
    return jsonError("Failed to run Hermes");
  }
}
