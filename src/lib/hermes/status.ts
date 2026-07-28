import {
  getGroqApiKey,
  getNvidiaApiKey,
  getHermesSetupHint,
  hasEmptyGroqKeyInEnvLocal,
  hasEmptyNvidiaKeyInEnvLocal,
} from "@/lib/hermes/env";
import {
  getDefaultHermesModel,
  getDefaultHermesProvider,
} from "@/lib/hermes/provider-defaults";
import {
  HERMES_PROVIDERS,
  type HermesProviderId,
} from "@/lib/hermes/providers";
import { isProviderConfigured } from "@/lib/hermes/create-model";

/** Server-side Hermes connectivity (never expose key values to client). */
export function getHermesConnectionStatus() {
  const groq = Boolean(getGroqApiKey());
  const nvidia = Boolean(getNvidiaApiKey());
  const configured = groq || nvidia;
  const defaultProvider = getDefaultHermesProvider();
  const availableProviders = HERMES_PROVIDERS.filter((p) =>
    isProviderConfigured(p.id),
  ).map((p) => ({
    id: p.id,
    label: p.label,
    models: p.models,
    defaultModel: getDefaultHermesModel(p.id),
  }));

  return {
    configured,
    offline: !configured,
    groqAvailable: groq,
    nvidiaAvailable: nvidia,
    defaultProvider,
    defaultModel: getDefaultHermesModel(defaultProvider),
    providers: availableProviders,
    catalog: HERMES_PROVIDERS,
    hint: configured ? undefined : getHermesSetupHint(),
    emptyEnvLocalOverride:
      hasEmptyGroqKeyInEnvLocal() || hasEmptyNvidiaKeyInEnvLocal(),
  };
}

export function assertProviderReady(provider: HermesProviderId): void {
  if (!isProviderConfigured(provider)) {
    throw new Error(
      `${provider === "nvidia" ? "NVIDIA_API_KEY" : "GROQ_API_KEY"} is not configured`,
    );
  }
}

/** @deprecated */
export function isGroqApiKeyPresent(): boolean {
  return Boolean(getGroqApiKey());
}
