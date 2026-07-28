"use client";

import { cn } from "@/lib/utils";
import {
  HERMES_PROVIDERS,
  type HermesProviderId,
} from "@/lib/hermes/providers";

const STORAGE_PROVIDER = "hermes_provider";
const STORAGE_MODEL = "hermes_model";

export interface ModelSelectorValue {
  provider: HermesProviderId;
  model: string;
}

interface ModelSelectorProps {
  value: ModelSelectorValue;
  onChange: (next: ModelSelectorValue) => void;
  availableProviders?: HermesProviderId[];
  className?: string;
}

export function loadStoredModelSelection(
  fallback: ModelSelectorValue,
): ModelSelectorValue {
  if (typeof window === "undefined") return fallback;
  try {
    const provider = localStorage.getItem(STORAGE_PROVIDER) as HermesProviderId | null;
    const model = localStorage.getItem(STORAGE_MODEL);
    if (
      (provider === "groq" || provider === "nvidia") &&
      model &&
      HERMES_PROVIDERS.find((p) => p.id === provider)?.models.some(
        (m) => m.id === model,
      )
    ) {
      return { provider, model };
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export function persistModelSelection(value: ModelSelectorValue) {
  try {
    localStorage.setItem(STORAGE_PROVIDER, value.provider);
    localStorage.setItem(STORAGE_MODEL, value.model);
  } catch {
    /* ignore */
  }
}

export function HermesModelSelector({
  value,
  onChange,
  availableProviders,
  className,
}: ModelSelectorProps) {
  const catalog = HERMES_PROVIDERS.filter(
    (p) => !availableProviders || availableProviders.includes(p.id),
  );
  const activeCatalog =
    catalog.find((p) => p.id === value.provider) ?? catalog[0];
  const models = activeCatalog?.models ?? [];

  function setProvider(provider: HermesProviderId) {
    const nextCatalog = HERMES_PROVIDERS.find((p) => p.id === provider);
    const defaultModel =
      nextCatalog?.models.find((m) => m.default)?.id ??
      nextCatalog?.models[0]?.id ??
      value.model;
    onChange({ provider, model: defaultModel });
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <label className="sr-only" htmlFor="hermes-provider">
        LLM provider
      </label>
      <select
        id="hermes-provider"
        value={value.provider}
        onChange={(e) => setProvider(e.target.value as HermesProviderId)}
        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-foam outline-none focus:border-teal-bright/50"
      >
        {catalog.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="hermes-model">
        Model
      </label>
      <select
        id="hermes-model"
        value={value.model}
        onChange={(e) =>
          onChange({ provider: value.provider, model: e.target.value })
        }
        className="min-w-[10rem] rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-foam outline-none focus:border-teal-bright/50"
      >
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
}
