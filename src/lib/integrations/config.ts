import type { IntegrationConnection, IntegrationProvider } from "@/lib/types";

export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  const vercel = process.env.VERCEL_URL;
  if (!vercel) return "http://localhost:3000";
  return vercel.startsWith("http") ? vercel : `https://${vercel}`;
}

export interface ProviderEnvConfig {
  provider: IntegrationProvider;
  label: string;
  description: string;
  envKeys: string[];
  configured: boolean;
  connectType: "api_key" | "oauth" | "service_account";
}

function hasAll(keys: string[]): boolean {
  return keys.every((key) => Boolean(process.env[key]?.trim()));
}

export function getProviderEnvConfigs(): ProviderEnvConfig[] {
  return [
    {
      provider: "openrouter",
      label: "OpenRouter",
      description: "Track LLM token usage and spend across models",
      envKeys: ["OPENROUTER_API_KEY"],
      configured: hasAll(["OPENROUTER_API_KEY"]),
      connectType: "api_key",
    },
    {
      provider: "trigger",
      label: "Trigger.dev",
      description: "Monitor background job runs, sessions, and compute spend",
      envKeys: ["TRIGGER_SECRET_KEY"],
      configured: hasAll(["TRIGGER_SECRET_KEY"]),
      connectType: "api_key",
    },
    {
      provider: "google",
      label: "Google (Gmail + Calendar)",
      description: "Sync inbox threads and upcoming calendar events",
      envKeys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
      configured: hasAll(["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]),
      connectType: "oauth",
    },
    {
      provider: "gcp",
      label: "Google Cloud Platform",
      description: "Monitor cloud spend and service health",
      envKeys: ["GCP_PROJECT_ID", "GCP_SERVICE_ACCOUNT_JSON"],
      configured: hasAll(["GCP_PROJECT_ID", "GCP_SERVICE_ACCOUNT_JSON"]),
      connectType: "service_account",
    },
    {
      provider: "github",
      label: "GitHub",
      description: "Sync real repositories and link them to harness projects",
      envKeys: ["GITHUB_TOKEN"],
      configured: hasAll(["GITHUB_TOKEN"]),
      connectType: "api_key",
    },
    {
      provider: "resend",
      label: "Resend",
      description: "Send team invite emails with accept-and-join links",
      envKeys: ["RESEND_API_KEY", "RESEND_FROM_EMAIL"],
      configured: hasAll(["RESEND_API_KEY", "RESEND_FROM_EMAIL"]),
      connectType: "api_key",
    },
  ];
}

export function isProviderConfigured(provider: IntegrationProvider): boolean {
  return getProviderEnvConfigs().find((p) => p.provider === provider)
    ?.configured ?? false;
}

export function buildDefaultConnections(): IntegrationConnection[] {
  return getProviderEnvConfigs().map((config) => ({
    id: `conn_${config.provider}`,
    provider: config.provider,
    label: config.label,
    status: config.configured ? "connected" : "disconnected",
    configured: config.configured,
    metadata: { connectType: config.connectType },
  }));
}
