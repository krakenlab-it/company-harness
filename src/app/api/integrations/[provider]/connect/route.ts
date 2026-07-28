import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/response";
import { buildGoogleAuthUrl } from "@/lib/integrations/google";
import { isProviderConfigured } from "@/lib/integrations/config";
import { createOAuthState } from "@/lib/integrations/oauth-state";

export async function GET(
  _request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;

  if (provider !== "google") {
    return jsonError("OAuth connect is only required for Google", 400);
  }

  if (!isProviderConfigured("google")) {
    return jsonError(
      "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local",
      503,
    );
  }

  const state = createOAuthState();
  const url = buildGoogleAuthUrl(state);
  return NextResponse.redirect(url);
}
