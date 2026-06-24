// ============================================================================
// Debug Ping Endpoint — Ultra-lightweight env check
// GET /api/debug/ping
// ============================================================================

import { NextResponse } from "next/server";
import { verifyInternalApiKey, debugNotFoundResponse } from "@/lib/internal-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  // Defense-in-depth: require INTERNAL_API_KEY header for all debug routes
  if (!verifyInternalApiKey(request)) {
    return debugNotFoundResponse();
  }

  // Block in production — debug endpoints are development-only
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    envLoaded: true,
    databaseUrlExists: !!process.env.DATABASE_URL,
  });
}