// ============================================================================
// Prisma Client Singleton — Production-Optimized MongoDB Connection
// Features: connection pooling, prepared statements caching, query logging control
// ============================================================================

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const isDev = process.env.NODE_ENV === "development";
  const dbUrl = process.env.DATABASE_URL;

  // Log connection state early — can't log too much, but critical info is useful
  if (!dbUrl) {
    console.error("[PRISMA] CRITICAL: DATABASE_URL is not set when creating PrismaClient!");
  } else {
    const maskedUrl = dbUrl.replace(/\/\/[^@]+@/, "//***:***@").replace(/\/[^?]+/, "/******");
    console.log(`[PRISMA] Creating PrismaClient with DATABASE_URL: ${maskedUrl}`);
  }

  const client = new PrismaClient({
    log: ["warn", "error"], // Always log warnings and errors, even in production
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  // Immediate connection test (non-blocking — logs result)
  client.$runCommandRaw({ ping: 1 })
    .then(() => console.log("[PRISMA] MongoDB connection ping SUCCESSFUL"))
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[PRISMA] MongoDB connection ping FAILED: ${msg}`);
    });

  // Graceful shutdown hooks (Node.js only — skip in Edge Runtime)
  if (typeof window === "undefined" && typeof process !== "undefined" && process.once) {
    const handleShutdown = async () => {
      await client.$disconnect();
    };

    process.once("SIGINT", handleShutdown);
    process.once("SIGTERM", handleShutdown);
    process.once("beforeExit", handleShutdown);
  }

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Test the database connection with a lightweight ping.
 * Returns `true` if connected, `false` otherwise.
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    return true;
  } catch (error) {
    console.error("[PRISMA] Database connection failed:", error);
    return false;
  }
}

/**
 * Gracefully disconnect Prisma on shutdown.
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export default prisma;