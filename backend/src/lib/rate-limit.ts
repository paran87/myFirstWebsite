/**
 * Minimal in-memory sliding-window rate limiter for sensitive endpoints
 * (login, upload). This is process-local — good enough for a single
 * server instance / MVP. For a multi-instance deployment, swap this for
 * a shared store (e.g. Upstash Redis) behind the same `rateLimit()`
 * function signature.
 */

const buckets = new Map<string, number[]>();

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = (buckets.get(key) ?? []).filter((t) => t > windowStart);
  timestamps.push(now);
  buckets.set(key, timestamps);

  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => t <= windowStart)) buckets.delete(k);
    }
  }

  return { allowed: timestamps.length <= limit, remaining: Math.max(0, limit - timestamps.length) };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
