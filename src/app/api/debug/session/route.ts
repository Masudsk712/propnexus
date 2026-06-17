// ============================================================================
// Debug Session Endpoint — Check authentication state from various sources
// GET /api/debug/session
// ============================================================================

import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  // 1. Get server-side session using auth()
  const serverSession = await auth();

  // 2. Try to decode JWT directly from the cookie
  const cookieHeader = (await headers()).get("cookie") || "";
  
  // Parse cookies to see what's available
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((c) => {
    const [key, ...valParts] = c.trim().split("=");
    if (key) cookies[key] = valParts.join("=") || "";
  });

  // Find any auth-related cookies
  const authCookies = Object.keys(cookies).filter((k) =>
    k.toLowerCase().includes("auth") || k.toLowerCase().includes("next-auth") || k.toLowerCase().includes("session")
  );
  const authCookieValues: Record<string, string> = {};
  authCookies.forEach((k) => {
    authCookieValues[k] = cookies[k] ? cookies[k].substring(0, 20) + "..." : "(empty)";
  });

  // 3. Attempt getToken() with default settings
  const requestHeaders = new Headers();
  requestHeaders.set("cookie", cookieHeader);
  const mockRequest = new Request("http://localhost:3000", {
    headers: requestHeaders,
  });

  const tokenDefault = await getToken({
    req: mockRequest,
    secret: process.env.AUTH_SECRET,
  });

  // 4. Also try with explicit cookie name (for authjs.session-token)
  const tokenWithAuthJsCookie = await getToken({
    req: mockRequest,
    secret: process.env.AUTH_SECRET,
    cookieName: "authjs.session-token",
  });

  // 5. Also try with secure variant
  const tokenWithSecureCookie = await getToken({
    req: mockRequest,
    secret: process.env.AUTH_SECRET,
    cookieName: "__Secure-authjs.session-token",
  });

  return NextResponse.json({
    authenticated: !!serverSession,
    serverSession: serverSession
      ? {
          user: serverSession.user
            ? {
                id: serverSession.user.id,
                email: serverSession.user.email,
                name: serverSession.user.name,
                role: (serverSession.user as any).role,
              }
            : null,
          expires: serverSession.expires,
        }
      : null,
    cookies: {
      all: Object.keys(cookies),
      authRelated: authCookies,
      authCookieValues,
      rawCookieCount: cookieHeader.split(";").filter(Boolean).length,
    },
    token: {
      defaultName: tokenDefault
        ? { sub: tokenDefault.sub, role: tokenDefault.role, id: tokenDefault.id }
        : null,
      authjsCookieName: tokenWithAuthJsCookie
        ? { sub: tokenWithAuthJsCookie.sub, role: tokenWithAuthJsCookie.role, id: tokenWithAuthJsCookie.id }
        : null,
      secureAuthjsCookieName: tokenWithSecureCookie
        ? { sub: tokenWithSecureCookie.sub, role: tokenWithSecureCookie.role, id: tokenWithSecureCookie.id }
        : null,
    },
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasAuthSecret: !!process.env.AUTH_SECRET,
      authSecretLength: process.env.AUTH_SECRET?.length ?? 0,
    },
  });
}