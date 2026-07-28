import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/response";
import {
  exchangeGoogleCode,
  storeGoogleTokens,
} from "@/lib/integrations/google";
import { consumeOAuthState } from "@/lib/integrations/oauth-state";
import { syncProvider } from "@/lib/integrations/sync";
import { getAppUrl } from "@/lib/integrations/config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const redirectBase = `${getAppUrl()}/integrations`;

  if (error) {
    return NextResponse.redirect(
      `${redirectBase}?google_error=${encodeURIComponent(error)}`,
    );
  }

  if (!code || !state || !consumeOAuthState(state)) {
    return NextResponse.redirect(`${redirectBase}?google_error=invalid_state`);
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    storeGoogleTokens("default", tokens);
    await syncProvider("google");
    return NextResponse.redirect(`${redirectBase}?google_connected=1`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "oauth_failed";
    return NextResponse.redirect(
      `${redirectBase}?google_error=${encodeURIComponent(message)}`,
    );
  }
}
