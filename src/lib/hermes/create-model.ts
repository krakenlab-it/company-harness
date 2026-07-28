import { createGroq } from "@ai-sdk/groq";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import { getGroqApiKey, getNvidiaApiKey } from "@/lib/hermes/env";
import {
  HERMES_NVIDIA_BASE_URL,
  type HermesProviderId,
} from "@/lib/hermes/providers";

export function isProviderConfigured(provider: HermesProviderId): boolean {
  if (provider === "groq") return Boolean(getGroqApiKey());
  return Boolean(getNvidiaApiKey());
}

export function createHermesLanguageModel(
  provider: HermesProviderId,
  modelId: string,
): LanguageModel {
  if (provider === "groq") {
    const apiKey = getGroqApiKey();
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }
    const groq = createGroq({ apiKey });
    return groq(modelId);
  }

  const apiKey = getNvidiaApiKey();
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not configured");
  }

  const nvidia = createOpenAICompatible({
    name: "nvidia",
    baseURL: HERMES_NVIDIA_BASE_URL,
    apiKey,
  });

  return nvidia(modelId);
}

/** Extra request fields for NVIDIA thinking models (GLM 5.2). */
export function getNvidiaProviderOptions(modelId: string) {
  if (!modelId.includes("glm")) return undefined;
  return {
    openaiCompatible: {
      body: {
        chat_template_kwargs: {
          enable_thinking: true,
          clear_thinking: false,
        },
      },
    },
  };
}
