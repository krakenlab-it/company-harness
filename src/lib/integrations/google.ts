import type {
  GoogleCalendarEventSummary,
  GoogleGmailThreadSummary,
} from "@/lib/types";
import { getAppUrl } from "@/lib/integrations/config";

const GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
  "openid",
  "email",
  "profile",
].join(" ");

export interface GoogleTokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
}

const tokenStore = new Map<string, GoogleTokenSet>();

export function storeGoogleTokens(providerKey: string, tokens: GoogleTokenSet): void {
  tokenStore.set(providerKey, tokens);
}

export function getGoogleTokens(providerKey = "default"): GoogleTokenSet | undefined {
  return tokenStore.get(providerKey);
}

export function buildGoogleAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }

  const redirectUri = `${getAppUrl()}/api/integrations/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH_BASE}?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleTokenSet> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not configured");
  }

  const redirectUri = `${getAppUrl()}/api/integrations/google/callback`;
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const body = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
  };

  if (!res.ok || !body.access_token) {
    throw new Error(body.error ?? "Failed to exchange Google authorization code");
  }

  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt: body.expires_in
      ? new Date(Date.now() + body.expires_in * 1000).toISOString()
      : undefined,
  };
}

async function refreshGoogleAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not configured");
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const body = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !body.access_token) {
    throw new Error(body.error ?? "Failed to refresh Google access token");
  }
  return body.access_token;
}

async function resolveAccessToken(): Promise<string> {
  const stored = getGoogleTokens();
  if (!stored) {
    throw new Error("Google is not connected — complete OAuth first");
  }
  if (stored.refreshToken) {
    const accessToken = await refreshGoogleAccessToken(stored.refreshToken);
    storeGoogleTokens("default", { ...stored, accessToken });
    return accessToken;
  }
  return stored.accessToken;
}

export async function fetchGmailThreads(
  maxResults = 10,
): Promise<Omit<GoogleGmailThreadSummary, "id">[]> {
  const accessToken = await resolveAccessToken();
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!listRes.ok) {
    throw new Error(`Gmail API error (${listRes.status})`);
  }

  const listBody = (await listRes.json()) as {
    messages?: { id: string }[];
  };

  const messages = listBody.messages ?? [];
  const threads: Omit<GoogleGmailThreadSummary, "id">[] = [];

  for (const msg of messages.slice(0, maxResults)) {
    const detailRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!detailRes.ok) continue;

    const detail = (await detailRes.json()) as {
      id: string;
      snippet?: string;
      internalDate?: string;
      payload?: { headers?: { name: string; value: string }[] };
    };

    const headers = detail.payload?.headers ?? [];
    const subject =
      headers.find((h) => h.name === "Subject")?.value ?? "(no subject)";
    const from = headers.find((h) => h.name === "From")?.value ?? "unknown";
    const dateHeader = headers.find((h) => h.name === "Date")?.value;
    const receivedAt = dateHeader
      ? new Date(dateHeader).toISOString()
      : detail.internalDate
        ? new Date(Number(detail.internalDate)).toISOString()
        : new Date().toISOString();

    threads.push({
      externalId: detail.id,
      subject,
      from,
      snippet: detail.snippet ?? "",
      receivedAt,
    });
  }

  return threads;
}

export async function fetchCalendarEvents(
  maxResults = 10,
): Promise<Omit<GoogleCalendarEventSummary, "id">[]> {
  const accessToken = await resolveAccessToken();
  const now = new Date();
  const timeMin = now.toISOString();
  const timeMax = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const url = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
  );
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Calendar API error (${res.status})`);
  }

  const body = (await res.json()) as {
    items?: {
      id: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
      attendees?: { email?: string }[];
    }[];
  };

  return (body.items ?? []).map((event) => ({
    externalId: event.id,
    title: event.summary ?? "(no title)",
    startAt: event.start?.dateTime ?? event.start?.date ?? new Date().toISOString(),
    endAt: event.end?.dateTime ?? event.end?.date ?? new Date().toISOString(),
    attendees: (event.attendees ?? [])
      .map((a) => a.email)
      .filter((e): e is string => Boolean(e)),
  }));
}
