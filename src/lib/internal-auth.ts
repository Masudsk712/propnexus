// ============================================================================
// Internal Auth Helper — API key-based debug route protection
// ============================================================================

import { NextResponse } from "next/server";

/**
 * Verify the internal API key from request header.
 * Debug routes should call this AND maintain the NODE_ENV check as defense-in-depth.
 */
export function verifyInternalApiKey(request: Request): boolean {
  const key = request.headers.get("x-internal-api-key");
  const expected = process.env.INTERNAL_API_KEY;
  
  // If no key configured, deny access (fail-closed)
  if (!expected) return false;
  
  // Constant-time comparison would be ideal, but for simplicity:
  return key === expected;
}

/**
 * Return 404 response for debug endpoints (masks existence)
 */
export function debugNotFoundResponse() {
  return NextResponse.json(
    { error: "Not found" },
    { status: 404 }
  );
}

/**
 * Return 403 response for unauthorized debug access
 */
export function debugForbiddenResponse() {
  return NextResponse.json(
    { error: "Forbidden" },
    { status: 403 }
  );
}