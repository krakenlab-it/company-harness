import { NextRequest, NextResponse } from "next/server";
import {
  isHermesConfigured,
  runHermes,
  type HermesMessageInput,
} from "@/lib/hermes/agent";
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
    const messages = toChatMessages();
    return NextResponse.json({
      messages,
      status: {
        configured: isHermesConfigured(),
        offline: false,
      },
    });
  } catch {
    return jsonError("Failed to load Hermes messages");
  }
}

export async function POST(request: NextRequest) {
  try {
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
    });

    return NextResponse.json({
      reply: result.text,
      message: result.text,
      content: result.text,
      toolResults: result.toolResults,
      offline: result.offline,
      status: {
        configured: isHermesConfigured(),
        offline: false,
      },
      messages: toChatMessages(),
    });
  } catch (error) {
    console.error("[hermes/chat]", error);
    return jsonError("Failed to run Hermes");
  }
}
