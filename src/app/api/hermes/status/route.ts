import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { getHermesConnectionStatus } from "@/lib/hermes/status";
import { jsonError } from "@/lib/api/response";

/** Diagnostics for Hermes LLM setup (never exposes secret values). */
export async function GET() {
  try {
    await requireAuth();
    const connection = getHermesConnectionStatus();
    return NextResponse.json({
      hermesInRepo: true,
      configured: connection.configured,
      offline: connection.offline,
      groqKeyPresent: connection.groqAvailable,
      nvidiaKeyPresent: connection.nvidiaAvailable,
      defaultProvider: connection.defaultProvider,
      defaultModel: connection.defaultModel,
      providers: connection.providers,
      catalog: connection.catalog,
      groqModel: connection.defaultModel,
      hint: connection.hint,
      emptyEnvLocalOverride: connection.emptyEnvLocalOverride,
      migrationsRequired: false,
      restartRequired:
        !connection.configured &&
        "After adding NVIDIA_API_KEY and/or GROQ_API_KEY, restart pnpm dev.",
      codePaths: {
        agent: "src/lib/hermes/agent.ts",
        chatApi: "src/app/api/hermes/chat/route.ts",
        ui: "src/components/hermes/chat.tsx",
        providers: "src/lib/hermes/providers.ts",
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonError(error.message, error.status);
    }
    return jsonError("Failed to load Hermes status");
  }
}
