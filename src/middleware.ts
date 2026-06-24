// ============================================================================
// Next.js Middleware — Route protection + Security Headers
// Edge-compatible: uses getToken() instead of auth() to avoid Prisma/bcrypt
// imports at module level that would crash Edge Runtime.
// ============================================================================

import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that require authentication
const protectedPaths = [
  "/dashboard",
  "/properties",
  "/tenants",
  "/maintenance",
  "/amenities",
  "/bookings",
  "/settings",
];

// Public-only paths (redirect to dashboard if already logged in)
const authPaths = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

// Allow static assets and public paths to pass through without auth check
const PUBLIC_PREFIXES = [
  "/_next",
  "/api",
  "/favicon.ico",
  "/images",
  "/manifest.json",
  "/og-image.png",
  "/apple-touch-icon.png",
  "/favicon-16x16.png",
];

// Paths that require internal API key (debug endpoints)
const INTERNAL_API_KEY_PATHS = ["/api/debug"];

// Role-based dashboard redirects
const ROLE_DASHBOARD_MAP: Record<string, string> = {
  admin: "/dashboard/admin",
  manager: "/dashboard/manager",
  tenant: "/dashboard/tenant",
};

// ── CSP Directives ─────────────────────────────────────────────────────────
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self'",
  "connect-src 'self' https://*.mongodb.net https://api.cloudinary.com wss:",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  IS_PRODUCTION ? "upgrade-insecure-requests" : "",
]
  .filter(Boolean)
  .join("; ");

// ── Security Headers (applied to all responses, cheap operation) ───────────
function applySecurityHeaders(response: NextResponse): void {
  const headers = response.headers;

  headers.set("X-DNS-Prefetch-Control", "on");
  headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  headers.set("Content-Security-Policy", CSP_DIRECTIVES);
  headers.set("X-Permitted-Cross-Domain-Policies", "none");
  headers.set("Cross-Origin-Embedder-Policy", "unsafe-none");
  headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
}

// Helper: does the path need auth handling?
function needsAuthCheck(pathname: string): boolean {
  // Skip public/static paths entirely
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return false;
  }

  // Check if it's a protected route or auth route
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuth = authPaths.some((p) => pathname.startsWith(p));

  return isProtected || isAuth;
}

export default async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Fast-path: skip auth check entirely for public/static routes
    if (!needsAuthCheck(pathname)) {
      const response = NextResponse.next();
      applySecurityHeaders(response);
      return response;
    }

    // ────────────────────────────────────────────────────────────────────────
    // Edge-compatible session check
    // getToken() decodes the JWT from the cookie using only Web Crypto API
    // NO Prisma, NO bcrypt, NO database calls — safe for Edge Runtime
    // ────────────────────────────────────────────────────────────────────────
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      cookieName: IS_PRODUCTION
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
    });
    const isLoggedIn = !!token;
    const userRole = token?.role as string | undefined;

    // Safe auth log — no PII emitted
    if (isLoggedIn) {
      console.log("[MIDDLEWARE] pathname:", pathname, "authenticated:", isLoggedIn);
    }

    let response: NextResponse;

    // Redirect authenticated users away from auth pages
    if (isLoggedIn && authPaths.some((p) => pathname.startsWith(p))) {
      const redirectUrl =
        ROLE_DASHBOARD_MAP[userRole ?? "tenant"] || "/dashboard/tenant";
      response = NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    // Role-based redirect from generic /dashboard to role-specific dashboard
    else if (
      isLoggedIn &&
      (pathname === "/dashboard" || pathname === "/dashboard/")
    ) {
      const redirectUrl =
        ROLE_DASHBOARD_MAP[userRole ?? "tenant"] || "/dashboard/tenant";
      response = NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    // Protect role-specific dashboard routes
    else if (isLoggedIn && pathname.startsWith("/dashboard/")) {
      const requestedRole = pathname.split("/")[2];
      if (requestedRole && userRole && requestedRole !== userRole) {
        const redirectUrl =
          ROLE_DASHBOARD_MAP[userRole] || "/dashboard/tenant";
        response = NextResponse.redirect(new URL(redirectUrl, request.url));
      } else {
        response = NextResponse.next();
      }
    }
    // Redirect unauthenticated users from protected routes
    else if (
      !isLoggedIn &&
      protectedPaths.some((p) => pathname.startsWith(p))
    ) {
      const callbackUrl = encodeURIComponent(pathname);
      response = NextResponse.redirect(
        new URL(`/login?callbackUrl=${callbackUrl}`, request.url)
      );
    }
    // Default: continue
    else {
      response = NextResponse.next();
    }

    // Apply security headers
    applySecurityHeaders(response);

    return response;
  } catch (error) {
    // ── CRASH GUARD ────────────────────────────────────────────────────────
    // Log the exact error for debugging, then return a safe fallback response
    // so the user's request is not dropped.
    console.error("[MIDDLEWARE_CRASH] Unhandled error:", error);

    // Safely serialize error details
    const errorMessage =
      error instanceof Error
        ? `${error.name}: ${error.message}\n${error.stack ?? "(no stack)"}`
        : String(error);
    console.error("[MIDDLEWARE_CRASH] Details:", errorMessage);

    // Safe fallback — allow request through instead of returning 500
    const fallbackResponse = NextResponse.next();
    applySecurityHeaders(fallbackResponse);
    return fallbackResponse;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|manifest.json).*)",
  ],
};
