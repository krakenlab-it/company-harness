import { getGroqApiKey, getNvidiaApiKey } from "@/lib/hermes/env";
import {
  HERMES_CURATED_MODELS,
  getDefaultModelForProvider,
  type HermesProviderId,
} from "@/lib/hermes/providers";

export function getDefaultHermesProvider(): HermesProviderId {
  const env = process.env.HERMES_DEFAULT_PROVIDER?.trim().toLowerCase();
  if (env === "groq" || env === "nvidia") return env;
  if (getNvidiaApiKey()) return "nvidia";
  if (getGroqApiKey()) return "groq";
  return "nvidia";
}

export function getDefaultHermesModel(
  provider?: HermesProviderId,
): string {
  const p = provider ?? getDefaultHermesProvider();
  const envKey =
    p === "nvidia"
      ? process.env.NVIDIA_MODEL?.trim()
      : process.env.GROQ_MODEL?.trim();
  if (envKey) return envKey;
  const curated = HERMES_CURATED_MODELS.find((m) => m.provider === p);
  if (curated) return curated.model;
  return getDefaultModelForProvider(p);
}
