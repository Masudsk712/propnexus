// ============================================================================
// Debug DB Endpoint — Test database connectivity with Prisma
// GET /api/debug/db
// ============================================================================

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  // Block in production — debug endpoints are development-only
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 }
    );
  }

  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    return NextResponse.json(
      {
        connected: false,
        error: "DATABASE_URL is not set",
      },
      { status: 500 }
    );
  }

  const tempPrisma = new PrismaClient({
    datasources: {
      db: { url: dbUrl },
    },
    log: ["warn", "error"],
  });

  try {
    const count = await tempPrisma.user.count();
    return NextResponse.json({
      connected: true,
      count,
    });
  } catch (err) {
    const fullError =
      err instanceof Error
        ? {
            message: err.message,
            name: err.name,
            stack: err.stack,
            cause: err.cause instanceof Error ? err.cause.message : err.cause,
          }
        : { message: String(err) };

    return NextResponse.json(
      {
        connected: false,
        error: fullError,
      },
      { status: 500 }
    );
  } finally {
    await tempPrisma.$disconnect().catch(() => {});
  }
}