import { join } from "path";
import { readFileSync, existsSync } from "fs";

const ROOT = process.cwd();

function readSecretFromEnv(name: string): string | undefined {
  const key = process.env[name]?.trim();
  if (!key || key.length < 8) return undefined;
  return key;
}

/** Read Groq key from process env (never log the value). */
export function getGroqApiKey(): string | undefined {
  return readSecretFromEnv("GROQ_API_KEY");
}

/** NVIDIA NIM / integrate.api.nvidia.com (never log the value). */
export function getNvidiaApiKey(): string | undefined {
  return readSecretFromEnv("NVIDIA_API_KEY");
}

function hasEmptyKeyInEnvLocal(name: string): boolean {
  const path = join(ROOT, ".env.local");
  if (!existsSync(path)) return false;
  try {
    const content = readFileSync(path, "utf8");
    const pattern = new RegExp(`^${name}=\\s*$`, "m");
    return pattern.test(content);
  } catch {
    return false;
  }
}

/** Empty `GROQ_API_KEY=` in .env.local overrides Cursor Environment Secrets in Next.js. */
export function hasEmptyGroqKeyInEnvLocal(): boolean {
  return hasEmptyKeyInEnvLocal("GROQ_API_KEY");
}

export function hasEmptyNvidiaKeyInEnvLocal(): boolean {
  return hasEmptyKeyInEnvLocal("NVIDIA_API_KEY");
}

export function getHermesSetupHint(): string {
  if (hasEmptyGroqKeyInEnvLocal() || hasEmptyNvidiaKeyInEnvLocal()) {
    return "Remove empty API key lines from .env.local (they block Environment Secrets), then restart pnpm dev — or paste your real keys there.";
  }
  if (!getGroqApiKey() && !getNvidiaApiKey()) {
    return "Set NVIDIA_API_KEY and/or GROQ_API_KEY in .env.local or Cursor Cloud Environment secrets, then restart pnpm dev.";
  }
  if (!getNvidiaApiKey() && !getGroqApiKey()) {
    return "Set at least one provider key (NVIDIA_API_KEY or GROQ_API_KEY).";
  }
  return "";
}

/** @deprecated use getHermesSetupHint */
export function getGroqSetupHint(): string {
  return getHermesSetupHint();
}

