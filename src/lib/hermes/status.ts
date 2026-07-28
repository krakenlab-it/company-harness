/** Server-side Hermes / Groq connectivity (never expose key values to client). */
export function isGroqApiKeyPresent(): boolean {
  const key = process.env.GROQ_API_KEY?.trim();
  return Boolean(key && key.length > 8);
}

export function getHermesConnectionStatus() {
  const keyPresent = isGroqApiKeyPresent();
  return {
    configured: keyPresent,
    offline: !keyPresent,
    groqModel: keyPresent
      ? (process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b")
      : undefined,
    hint: keyPresent
      ? undefined
      : "Add GROQ_API_KEY to Cursor Environment Secrets (or .env.local), then restart pnpm dev.",
  };
}
