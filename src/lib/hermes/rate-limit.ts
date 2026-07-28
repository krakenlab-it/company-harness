const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkHermesRateLimit(
  memberId: string,
  limitRpm: number,
): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const windowMs = 60_000;
  const bucket = buckets.get(memberId);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(memberId, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limitRpm) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}

export function resetHermesRateLimits(): void {
  buckets.clear();
}
