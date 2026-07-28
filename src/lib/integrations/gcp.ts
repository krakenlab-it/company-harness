import type { GcpHealthCheck } from "@/lib/types";

interface ServiceAccountJson {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

function parseServiceAccount(): ServiceAccountJson {
  const raw = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("GCP_SERVICE_ACCOUNT_JSON is not configured");
  }
  try {
    return JSON.parse(raw) as ServiceAccountJson;
  } catch {
    throw new Error("GCP_SERVICE_ACCOUNT_JSON must be valid JSON");
  }
}

async function getGoogleAccessToken(): Promise<string> {
  const sa = parseServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString(
    "base64url",
  );
  const claimSet = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform.read-only",
      aud: sa.token_uri ?? "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    }),
  ).toString("base64url");

  const crypto = await import("crypto");
  const signInput = `${header}.${claimSet}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(signInput)
    .sign(sa.private_key, "base64url");

  const jwt = `${signInput}.${signature}`;
  const tokenRes = await fetch(sa.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenBody = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenRes.ok || !tokenBody.access_token) {
    throw new Error(tokenBody.error ?? "Failed to obtain GCP access token");
  }
  return tokenBody.access_token;
}

export async function fetchGcpMonthlySpendUsd(): Promise<number> {
  const projectId = process.env.GCP_PROJECT_ID;
  const billingAccountId = process.env.GCP_BILLING_ACCOUNT_ID;
  if (!projectId) {
    throw new Error("GCP_PROJECT_ID is not configured");
  }

  if (!billingAccountId) {
    return 0;
  }

  const token = await getGoogleAccessToken();
  const url = `https://cloudbilling.googleapis.com/v1/billingAccounts/${billingAccountId}/projects/${projectId}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return 0;
  }

  const estimate = Number(process.env.GCP_MONTHLY_SPEND_USD ?? "0");
  return estimate;
}

export async function fetchGcpHealthChecks(): Promise<
  Omit<GcpHealthCheck, "id">[]
> {
  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) {
    throw new Error("GCP_PROJECT_ID is not configured");
  }

  const token = await getGoogleAccessToken();
  const checkedAt = new Date().toISOString();
  const checks: Omit<GcpHealthCheck, "id">[] = [];

  const runRes = await fetch(
    `https://run.googleapis.com/v2/projects/${projectId}/locations/-/services`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (runRes.ok) {
    const body = (await runRes.json()) as { services?: { name?: string; uri?: string }[] };
    const services = body.services ?? [];
    if (services.length === 0) {
      checks.push({
        service: "Cloud Run",
        status: "unknown",
        message: "No Cloud Run services found in project",
        checkedAt,
      });
    } else {
      for (const svc of services.slice(0, 5)) {
        checks.push({
          service: svc.name?.split("/").pop() ?? "Cloud Run service",
          status: svc.uri ? "healthy" : "degraded",
          message: svc.uri ? `Serving at ${svc.uri}` : "No public URI",
          checkedAt,
        });
      }
    }
  } else {
    checks.push({
      service: "Cloud Run",
      status: "unknown",
      message: `Could not query Cloud Run (${runRes.status})`,
      checkedAt,
    });
  }

  return checks;
}
