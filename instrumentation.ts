// ============================================================================
// Sentry Instrumentation — Required by @sentry/nextjs
// ============================================================================

import * as Sentry from "@sentry/nextjs";

export async function register() {
  // Only initialize in production
  if (process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === "production") {
    await Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    });
  }
}