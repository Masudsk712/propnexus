// ============================================================================
// Debug Ping Endpoint — Ultra-lightweight env check
// GET /api/debug/ping
// ============================================================================

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    envLoaded: true,
    databaseUrlExists: !!process.env.DATABASE_URL,
  });
}