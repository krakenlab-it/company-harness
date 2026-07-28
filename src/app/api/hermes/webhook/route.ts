import { NextRequest, NextResponse } from "next/server";
import { isHermesConfigured, runHermes } from "@/lib/hermes/agent";
import { jsonError, parseJsonBody } from "@/lib/api/response";

/**
 * Easy webhook channel for Slack, Zapier, or any HTTP client.
 *
 * POST /api/hermes/webhook
 * Content-Type: application/json
 *
 * Body:
 *   { "text": "What's our cloud spend this month?", "secret": "optional-shared-secret" }
 *
 * If HERMES_WEBHOOK_SECRET is set in the environment, the request must include
 * a matching `secret` field (or `Authorization: Bearer <secret>` header).
 *
 * Response:
 *   { "reply": "..." }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<{ text?: string; secret?: string }>(
      request,
    );

    if (!body?.text?.trim()) {
      return jsonError("text is required", 400);
    }

    const expectedSecret = process.env.HERMES_WEBHOOK_SECRET;
    if (expectedSecret) {
      const authHeader = request.headers.get("authorization");
      const bearer =
        authHeader?.startsWith("Bearer ")
          ? authHeader.slice("Bearer ".length)
          : undefined;
      const provided = body.secret ?? bearer;

      if (!provided || provided !== expectedSecret) {
        return jsonError("Unauthorized — invalid or missing webhook secret", 401);
      }
    }

    const result = await runHermes({
      messages: [{ role: "user", content: body.text.trim() }],
    });

    return NextResponse.json({
      reply: result.text,
      offline: result.offline ?? !isHermesConfigured(),
    });
  } catch (error) {
    console.error("[hermes/webhook]", error);
    return jsonError("Failed to process webhook");
  }
}

export async function GET() {
  return NextResponse.json({
    channel: "webhook",
    description:
      "POST JSON { text, secret? } to chat with Hermes from Slack, Zapier, or scripts.",
    endpoint: "/api/hermes/webhook",
    example: {
      text: "Summarize active projects and open tickets",
      secret: "your-HERMES_WEBHOOK_SECRET-if-set",
    },
    auth:
      "Set HERMES_WEBHOOK_SECRET in .env and pass it as body.secret or Authorization: Bearer <secret>",
  });
}
