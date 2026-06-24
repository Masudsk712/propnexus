// ============================================================================
// Sentry Server Configuration — API & server-side error tracking
// ============================================================================

import * as Sentry from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === "production";
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Only initialize if DSN is provided
if (dsn) {
  Sentry.init({
    dsn,
    enabled: isProduction,
    // Performance monitoring: sample 20% of transactions in production
    tracesSampleRate: isProduction ? 0.2 : 0,
    environment: process.env.NODE_ENV ?? "development",
    // Release tracking for deployment correlation
    release: process.env.VERCEL_GIT_COMMIT_SHA ?? undefined,
    ignoreErrors: [
      "NEXT_REDIRECT",
      "NEXT_NOT_FOUND",
    ],
    // Attach stack traces to all events for better debugging
    attachStacktrace: true,
  });
}