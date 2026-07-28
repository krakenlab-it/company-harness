const oauthStates = new Map<string, { createdAt: number }>();

export function createOAuthState(): string {
  const state = crypto.randomUUID();
  oauthStates.set(state, { createdAt: Date.now() });
  return state;
}

export function consumeOAuthState(state: string): boolean {
  const entry = oauthStates.get(state);
  if (!entry) return false;
  oauthStates.delete(state);
  const ageMs = Date.now() - entry.createdAt;
  return ageMs < 10 * 60 * 1000;
}
