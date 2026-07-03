import { recordSecurityEvent } from "@/lib/security-log";

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  eventType?: string;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  __a7RateLimits?: Map<string, RateLimitRecord>;
};

const buckets = globalForRateLimit.__a7RateLimits || new Map<string, RateLimitRecord>();
globalForRateLimit.__a7RateLimits = buckets;

export function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

export async function consumeRateLimit(request: Request, options: RateLimitOptions) {
  const now = Date.now();
  const ip = getClientIp(request);
  const key = `${options.key}:${ip}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.limit - 1, retryAfterSeconds: 0 };
  }

  current.count += 1;

  if (current.count > options.limit) {
    const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
    await recordSecurityEvent({
      type: options.eventType || "rate_limit_exceeded",
      ip,
      detail: options.key
    });

    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  return {
    allowed: true,
    remaining: Math.max(0, options.limit - current.count),
    retryAfterSeconds: 0
  };
}
