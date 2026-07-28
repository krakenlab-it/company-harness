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
      : "Add GROQ_API_KEY to Cursor Cloud Environment secrets (or .env.local), then restart — Cloud runs need a new agent session if the key still does not appear.",
  };
}
