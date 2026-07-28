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
