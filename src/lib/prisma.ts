// ============================================================================
// Prisma Client Singleton — Production-Optimized MongoDB Connection
// Features: connection pooling, prepared statements caching, query logging control
// ============================================================================

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const initStart = Date.now();
  const isDev = process.env.NODE_ENV === "development";
  const dbUrl = process.env.DATABASE_URL;

  // Log connection state early — can't log too much, but critical info is useful
  if (!dbUrl) {
    console.error("[PRISMA] CRITICAL: DATABASE_URL is not set when creating PrismaClient!");
  } else {
    const maskedUrl = dbUrl.replace(/\/\/[^@]+@/, "//***:***@").replace(/\/[^?]+/, "/******");
    console.log(`[PRISMA] Creating PrismaClient with DATABASE_URL: ${maskedUrl}`);

    // Log just the hostname for quick verification
    try {
      const hostnameMatch = dbUrl.match(/@([^/]+)/);
      if (hostnameMatch) {
        console.log(`[PRISMA] Database hostname: ${hostnameMatch[1]}`);
      }
      // Log the full DATABASE_URL for Vercel env var comparison (replaces credentials)
      console.log(`[PRISMA] DATABASE_URL (masked for comparison): ${maskedUrl}`);
      console.log(`[PRISMA] DATABASE_URL used by Prisma: ${dbUrl.startsWith("mongodb") ? "starts with mongodb:// or mongodb+srv:// ✓" : "INVALID PREFIX ✗"}`);
    } catch (e) {
      // ignore parse errors
    }
  }

  const client = new PrismaClient({
    log: ["warn", "error", { emit: "stdout", level: "query" }],
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  // Query timeout logging middleware — logs any query taking > 5 seconds
  client.$use(async (params, next) => {
    const start = Date.now();
    const result = await next(params);
    const duration = Date.now() - start;
    if (duration > 5000) {
      console.warn(`[PRISMA] SLOW QUERY (${duration}ms): model=${params.model}, action=${params.args?.where ? "with-where" : "no-where"}`);
    }
    return result;
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

  const initDuration = Date.now() - initStart;
  console.log(`[PRISMA] Client initialized in ${initDuration}ms`);
  console.log("[PRISMA] INIT OK — PrismaClient constructor did not hang (synchronous)");

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