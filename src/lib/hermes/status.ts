import { getGroqApiKey, getGroqSetupHint, hasEmptyGroqKeyInEnvLocal } from "@/lib/hermes/env";
import { getHermesGroqModel } from "@/lib/hermes/config";

/** Server-side Hermes / Groq connectivity (never expose key values to client). */
export function isGroqApiKeyPresent(): boolean {
  return Boolean(getGroqApiKey());
}

export function getHermesConnectionStatus() {
  const keyPresent = isGroqApiKeyPresent();
  return {
    configured: keyPresent,
    offline: !keyPresent,
    groqModel: keyPresent
      ? (process.env.GROQ_MODEL?.trim() || getHermesGroqModel())
      : undefined,
    hint: keyPresent ? undefined : getGroqSetupHint(),
    emptyEnvLocalOverride: hasEmptyGroqKeyInEnvLocal(),
  };
}
