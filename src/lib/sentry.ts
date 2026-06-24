// ============================================================================
// Sentry Utility — Production Monitoring & Alerting
// Provides a consistent wrapper for Sentry error tracking across API routes
// and server-side code. Integrates with the structured logging system.
// ============================================================================

import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";

/**
 * Check if Sentry is properly configured (DSN exists).
 */
export function isSentryConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SENTRY_DSN;
}

/**
 * Validate Sentry environment variables at startup.
 * Logs warnings if missing in production.
 */
export function validateSentryConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  const isProduction = process.env.NODE_ENV === "production";

  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    missing.push("NEXT_PUBLIC_SENTRY_DSN");
    if (isProduction) {
      logger.warn("[SENTRY] NEXT_PUBLIC_SENTRY_DSN not set — error tracking disabled in production!");
    }
  }
  if (!process.env.SENTRY_ORG) {
    missing.push("SENTRY_ORG");
  }
  if (!process.env.SENTRY_PROJECT) {
    missing.push("SENTRY_PROJECT");
  }

  if (missing.length > 0 && isProduction) {
    logger.warn(`[SENTRY] Missing config: ${missing.join(", ")}`);
  }

  return { valid: missing.length === 0, missing };
}

/**
 * Capture an exception with context tags.
 * Use this in API route catch blocks.
 */
export function captureError(
  error: unknown,
  context?: { route?: string; method?: string; userId?: string }
) {
  if (!isSentryConfigured()) return;
  Sentry.captureException(error, {
    tags: {
      route: context?.route ?? "unknown",
      method: context?.method ?? "unknown",
    },
    user: context?.userId ? { id: context.userId } : undefined,
  });
}

/**
 * Log a breadcrumb for a user action.
 */
export function logUserAction(action: string, data?: Record<string, unknown>) {
  if (!isSentryConfigured()) return;
  Sentry.addBreadcrumb({
    category: "user-action",
    message: action,
    data: data as Record<string, any>,
    level: "info",
  });
}

/**
 * Set the current user in Sentry context for session tracking.
 */
export function setSentryUser(user: { id: string; email?: string; role?: string }) {
  if (!isSentryConfigured()) return;
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

/**
 * Clear the current Sentry user context (on logout).
 */
export function clearSentryUser() {
  if (!isSentryConfigured()) return;
  Sentry.setUser(null);
}

export default Sentry;