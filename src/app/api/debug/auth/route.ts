// ============================================================================
// Debug Auth Endpoint — Diagnostic tool for production auth issues
// GET /api/debug/auth
// ============================================================================

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

/**
 * Lightweight database URL validity check (no Prisma instantiation needed).
 */
function databaseUrlLooksValid(url: string | undefined): boolean {
  if (!url) return false;
  // Must start with mongodb+srv:// or mongodb://
  if (!url.startsWith("mongodb+srv://") && !url.startsWith("mongodb://")) return false;
  // Must contain @ (separator between credentials and host)
  if (!url.includes("@")) return false;
  return true;
}

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

  // Initialize a temporary Prisma client for the check — won't pollute global singleton
  let databaseConnected = false;
  let userCount = 0;
  let prismaError: string | null = null;

  const databaseUrlExists = !!process.env.DATABASE_URL;
  const databaseUrlValid = databaseUrlLooksValid(process.env.DATABASE_URL);
  const authSecretExists = !!process.env.AUTH_SECRET;
  const authUrlExists = !!process.env.AUTH_URL;
  const nodeEnv = process.env.NODE_ENV ?? "not-set";

  // Attempt actual database connection
  if (databaseUrlExists && databaseUrlValid) {
    const tempPrisma = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL },
      },
    });
    try {
      // Ping the database
      await tempPrisma.$runCommandRaw({ ping: 1 });
      databaseConnected = true;

      // Count users
      userCount = await tempPrisma.user.count();
    } catch (err) {
      prismaError = err instanceof Error ? err.message : String(err);
      databaseConnected = false;
    } finally {
      await tempPrisma.$disconnect().catch(() => {});
    }
  }

  return NextResponse.json({
    databaseConnected,
    databaseUrlExists,
    databaseUrlValid,
    userCount,
    authSecretExists,
    authUrlExists,
    nodeEnv,
    prismaError,
    // Environment variable mask check (show only first/last few chars)
    databaseUrlPreview: databaseUrlExists
      ? maskConnectionString(process.env.DATABASE_URL!)
      : null,
    authSecretPreview: authSecretExists
      ? maskSecret(process.env.AUTH_SECRET!)
      : null,
  });
}

/**
 * Mask a MongoDB connection string — show scheme + host, hide credentials.
 * Example: mongodb+srv://***:***@cluster0.xxxxx.mongodb.net/******?retryWrites=true&w=majority
 */
function maskConnectionString(url: string): string {
  try {
    // Show only the protocol and host — replace credentials and database name
    return url.replace(/\/\/[^@]+@/, "//***:***@").replace(/\/[^?]+/, "/******");
  } catch {
    return "(could not mask)";
  }
}

/**
 * Mask a secret — show only first 4 and last 4 characters.
 */
function maskSecret(secret: string): string {
  if (secret.length <= 8) return "***";
  return secret.slice(0, 4) + "..." + secret.slice(-4);
}