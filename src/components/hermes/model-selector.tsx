"use client";

import { cn } from "@/lib/utils";
import {
  HERMES_CURATED_MODELS,
  decodeModelChoice,
  encodeModelChoice,
  getDefaultCuratedModel,
  type HermesProviderId,
} from "@/lib/hermes/providers";

const STORAGE_KEY = "hermes_model_choice";

export interface ModelSelectorValue {
  provider: HermesProviderId;
  model: string;
}

interface ModelSelectorProps {
  value: ModelSelectorValue;
  onChange: (next: ModelSelectorValue) => void;
  nvidiaAvailable?: boolean;
  groqAvailable?: boolean;
  className?: string;
}

export function loadStoredModelSelection(
  fallback: ModelSelectorValue,
): ModelSelectorValue {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const decoded = decodeModelChoice(stored);
      if (decoded) return decoded;
    }
    // legacy keys
    const provider = localStorage.getItem("hermes_provider") as HermesProviderId | null;
    const model = localStorage.getItem("hermes_model");
    if ((provider === "groq" || provider === "nvidia") && model) {
      const encoded = encodeModelChoice(provider, model);
      const decoded = decodeModelChoice(encoded);
      if (decoded) return decoded;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export function persistModelSelection(value: ModelSelectorValue) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      encodeModelChoice(value.provider, value.model),
    );
  } catch {
    /* ignore */
  }
}

export function HermesModelSelector({
  value,
  onChange,
  nvidiaAvailable,
  groqAvailable,
  className,
}: ModelSelectorProps) {
  const selected = encodeModelChoice(value.provider, value.model);
  const defaultChoice = getDefaultCuratedModel();
  const safeSelected =
    decodeModelChoice(selected) ??
    decodeModelChoice(
      encodeModelChoice(defaultChoice.provider, defaultChoice.model),
    )!;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label className="sr-only" htmlFor="hermes-model">
        Model
      </label>
      <select
        id="hermes-model"
        value={encodeModelChoice(safeSelected.provider, safeSelected.model)}
        onChange={(e) => {
          const next = decodeModelChoice(e.target.value);
          if (next) onChange(next);
        }}
        className="max-w-[13rem] sm:max-w-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-foam outline-none focus:border-teal-bright/50 truncate"
      >
        <optgroup label="NVIDIA">
          {HERMES_CURATED_MODELS.filter((m) => m.provider === "nvidia").map(
            (m) => (
              <option
                key={m.model}
                value={encodeModelChoice(m.provider, m.model)}
              >
                {m.label.replace(/^NVIDIA · /, "")}
                {!nvidiaAvailable ? " (add key)" : ""}
              </option>
            ),
          )}
        </optgroup>
        <optgroup label="Groq">
          {HERMES_CURATED_MODELS.filter((m) => m.provider === "groq").map(
            (m) => (
              <option
                key={m.model}
                value={encodeModelChoice(m.provider, m.model)}
              >
                {m.label.replace(/^Groq · /, "")}
                {!groqAvailable ? " (add key)" : ""}
              </option>
            ),
          )}
        </optgroup>
      </select>
    </div>
  );
}
