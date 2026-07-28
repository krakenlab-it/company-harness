export type HermesProviderId = "groq" | "nvidia";

export interface HermesModelOption {
  id: string;
  label: string;
  description?: string;
  default?: boolean;
}

export interface HermesProviderOption {
  id: HermesProviderId;
  label: string;
  models: HermesModelOption[];
}

export const HERMES_NVIDIA_BASE_URL =
  "https://integrate.api.nvidia.com/v1";

export const HERMES_PROVIDERS: HermesProviderOption[] = [
  {
    id: "nvidia",
    label: "NVIDIA NIM",
    models: [
      {
        id: "z-ai/glm-5.2",
        label: "GLM 5.2",
        description: "Default — strong reasoning (Z.ai)",
        default: true,
      },
      {
        id: "moonshotai/kimi-k2-instruct",
        label: "Kimi K2 Instruct",
        description: "Moonshot Kimi K2",
      },
      {
        id: "moonshotai/kimi-k2-thinking",
        label: "Kimi K2 Thinking",
        description: "Kimi with extended reasoning",
      },
      {
        id: "nvidia/nemotron-3-ultra-550b-a55b",
        label: "Nemotron 3 Ultra",
        description: "NVIDIA flagship",
      },
      {
        id: "z-ai/glm4.7",
        label: "GLM 4.7",
        description: "Previous GLM generation",
      },
    ],
  },
  {
    id: "groq",
    label: "Groq",
    models: [
      {
        id: "openai/gpt-oss-120b",
        label: "GPT-OSS 120B",
        description: "Fast, capable default",
        default: true,
      },
      {
        id: "llama-3.3-70b-versatile",
        label: "Llama 3.3 70B",
        description: "Fallback / versatile",
      },
      {
        id: "meta-llama/llama-4-maverick-17b-128e-instruct",
        label: "Llama 4 Maverick 17B",
        description: "Lightweight",
      },
      {
        id: "qwen/qwen3-32b",
        label: "Qwen3 32B",
        description: "Strong mid-size",
      },
    ],
  },
];

export function getProviderCatalog(id: HermesProviderId): HermesProviderOption {
  return HERMES_PROVIDERS.find((p) => p.id === id) ?? HERMES_PROVIDERS[0]!;
}

export function getDefaultModelForProvider(
  provider: HermesProviderId,
): string {
  const catalog = getProviderCatalog(provider);
  return (
    catalog.models.find((m) => m.default)?.id ??
    catalog.models[0]?.id ??
    "z-ai/glm-5.2"
  );
}

export function isValidProviderModel(
  provider: HermesProviderId,
  model: string,
): boolean {
  return getProviderCatalog(provider).models.some((m) => m.id === model);
}

export function resolveProviderModel(
  provider?: string | null,
  model?: string | null,
): { provider: HermesProviderId; model: string } {
  const providerId: HermesProviderId =
    provider === "groq" || provider === "nvidia" ? provider : "nvidia";
  const modelId = model?.trim();
  if (modelId && isValidProviderModel(providerId, modelId)) {
    return { provider: providerId, model: modelId };
  }
  return {
    provider: providerId,
    model: getDefaultModelForProvider(providerId),
  };
}
