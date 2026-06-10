// ============================================================================
// Rate Limiting — Upstash-based rate limiter for API routes
// Falls back to in-memory if UPSTASH_REDIS_REST_URL is not configured.
// ============================================================================

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Upstash Rate Limiter ───────────────────────────────────────────────────
let rateLimiter: Ratelimit | null = null;

function getRateLimiter(): Ratelimit | null {
  if (rateLimiter) return rateLimiter;

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    const redis = new Redis({ url: redisUrl, token: redisToken });
    rateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      analytics: true,
      prefix: "ratelimit",
    });
  }

  return rateLimiter;
}

// ── In-memory fallback ─────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitOptions {
  interval?: number; // in milliseconds (default: 60000 = 1 minute)
  maxRequests?: number; // max requests per interval (default: 10)
}

export async function rateLimit(
  key: string,
  options: RateLimitOptions = {}
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
  const upstashLimiter = getRateLimiter();

  // Use Upstash if available
  if (upstashLimiter) {
    const result = await upstashLimiter.limit(key);
    return {
      success: result.success,
      remaining: result.remaining,
      resetTime: result.reset,
    };
  }

  // Fallback: in-memory rate limiting
  const { interval = 60_000, maxRequests = 10 } = options;
  const now = Date.now();
  const record = rateLimitMap.get(key);

  // Clear expired entries every 5 minutes to prevent memory leaks
  if (rateLimitMap.size > 1000) {
    const expiredKeys: string[] = [];
    rateLimitMap.forEach((v, k) => {
      if (now > v.resetTime) expiredKeys.push(k);
    });
    expiredKeys.forEach((k) => rateLimitMap.delete(k));
  }

  if (!record || now > record.resetTime) {
    // Start new window
    const resetTime = now + interval;
    rateLimitMap.set(key, { count: 1, resetTime });
    return { success: true, remaining: maxRequests - 1, resetTime };
  }

  if (record.count >= maxRequests) {
    return { success: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { success: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

/**
 * Get a rate limit key from the request (IP-based).
 * Uses X-Forwarded-For header or falls back to a default.
 */
export function getRateLimitKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const pathname = new URL(request.url).pathname;
  return `${ip}:${pathname}`;
}