import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { getHermesConnectionStatus } from "@/lib/hermes/status";
import { getHermesGroqModel } from "@/lib/hermes/config";
import { jsonError } from "@/lib/api/response";

/** Diagnostics for Hermes / Groq setup (never exposes secret values). */
export async function GET() {
  try {
    await requireAuth();
    const connection = getHermesConnectionStatus();
    return NextResponse.json({
      hermesInRepo: true,
      groqKeyPresent: connection.configured,
      groqModel: connection.groqModel ?? getHermesGroqModel(),
      offline: connection.offline,
      hint: connection.hint,
      migrationsRequired: false,
      restartRequired:
        !connection.configured &&
        "After adding GROQ_API_KEY, restart pnpm dev (Cloud: start a new agent run if secrets still missing).",
      codePaths: {
        agent: "src/lib/hermes/agent.ts",
        chatApi: "src/app/api/hermes/chat/route.ts",
        ui: "src/components/hermes/chat.tsx",
        page: "src/app/(harness)/hermes/page.tsx",
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to load Hermes status");
  }
}
