import { readFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();

/** Read Groq key from process env (never log the value). */
export function getGroqApiKey(): string | undefined {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key || key.length < 8) return undefined;
  return key;
}

/** Empty `GROQ_API_KEY=` in .env.local overrides Cursor Environment Secrets in Next.js. */
export function hasEmptyGroqKeyInEnvLocal(): boolean {
  const path = join(ROOT, ".env.local");
  if (!existsSync(path)) return false;
  try {
    const content = readFileSync(path, "utf8");
    return /^GROQ_API_KEY=\s*$/m.test(content);
  } catch {
    return false;
  }
}

export function getGroqSetupHint(): string {
  if (hasEmptyGroqKeyInEnvLocal()) {
    return "Remove the empty GROQ_API_KEY= line from .env.local (it blocks Environment Secrets), then restart pnpm dev — or paste your key on that line.";
  }
  if (!getGroqApiKey()) {
    return "Set GROQ_API_KEY in .env.local (recommended on Desktop) or Cursor Cloud Environment secrets, then restart pnpm dev.";
  }
  return "";
}
