/**
 * Hermes Groq model defaults.
 * @see https://console.groq.com/docs/models
 * @see https://console.groq.com/docs/deprecations (llama-3.3-70b → gpt-oss-120b)
 */
export const HERMES_DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";

/** Fallback when the primary model is unavailable on the account tier. */
export const HERMES_FALLBACK_GROQ_MODEL = "llama-3.3-70b-versatile";

export function getHermesGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || HERMES_DEFAULT_GROQ_MODEL;
}

/** Max LLM + tool loop steps (AI SDK default is 1 — too low for ticket workflows). */
export function getHermesMaxToolSteps(): number {
  const raw = process.env.HERMES_MAX_TOOL_STEPS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 12;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 30) : 12;
}

/** Requests per member per minute for POST /api/hermes/chat */
export function getHermesRateLimitRpm(): number {
  const raw = process.env.HERMES_RATE_LIMIT_RPM?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 20;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 120) : 20;
}
