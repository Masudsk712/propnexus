// ============================================================================
// Health Check Endpoint — Uptime Monitoring & Load Balancer Probes
// GET /api/health — Lightweight, always responds 200 OK
// GET /api/health?full=true — Detailed health with DB check
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface HealthStatus {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  checks: {
    database: { status: "ok" | "error"; latency?: number };
    memory?: { status: "ok" | "degraded"; usagePercent?: number };
  };
}

async function getBasicHealth(): Promise<HealthStatus> {
  const start = Date.now();

  // Database check (lightweight ping)
  let dbStatus: "ok" | "error" = "error";
  let dbLatency: number | undefined;
  try {
    const dbStart = Date.now();
    await prisma.$runCommandRaw({ ping: 1 });
    dbLatency = Date.now() - dbStart;
    dbStatus = "ok";
  } catch {
    dbStatus = "error";
  }

  const totalLatency = Date.now() - start;

  return {
    status: dbStatus === "ok" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA ?? "1.0.0",
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV ?? "development",
    checks: {
      database: {
        status: dbStatus,
        latency: dbLatency,
      },
    },
  };
}

export async function GET(request: NextRequest) {
  const health = await getBasicHealth();

  const statusCode = health.status === "ok" ? 200 : health.status === "degraded" ? 200 : 503;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}