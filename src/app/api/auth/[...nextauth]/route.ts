// ============================================================================
// NextAuth v5 Route Handler — catches all /api/auth/* requests
// Rate limited with Upstash for login POST requests
// ============================================================================

import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

const { GET: originalGET, POST: originalPOST } = handlers;

/**
 * GET handler — no rate limiting needed for auth pages
 */
export async function GET(req: NextRequest) {
  return originalGET(req);
}

/**
 * POST handler with rate limiting for login attempts.
 * Only rate-limits credentials-based login, not OAuth callbacks.
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Only rate-limit the credentials callback endpoint
  if (pathname.endsWith("/callback/credentials")) {
    const key = getRateLimitKey(req);
    const { success, remaining, resetTime } = await rateLimit(key, {
      interval: 60_000,
      maxRequests: 5,
    });

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many login attempts. Please try again later.",
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((resetTime - Date.now()) / 1000)),
            "X-RateLimit-Remaining": String(remaining),
          },
        }
      );
    }
  }

  return originalPOST(req);
}