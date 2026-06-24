// ============================================================================
// Sentry Client Configuration — Browser error tracking & session replay
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
    // Session replay: sample 10% of sessions, 100% on error
    replaysSessionSampleRate: isProduction ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0,
    environment: process.env.NODE_ENV ?? "development",
    // Release tracking for deployment correlation
    release: process.env.VERCEL_GIT_COMMIT_SHA ?? undefined,
    ignoreErrors: [
      // Network errors are expected
      "NetworkError",
      "Failed to fetch",
      "Load failed",
      "TypeError: Failed to fetch",
      "TypeError: NetworkError",
      // Next.js router errors
      "NEXT_REDIRECT",
      "NEXT_NOT_FOUND",
      // Browser extension errors
      "chrome-extension://",
      "moz-extension://",
      "safari-extension://",
      // Ad blockers
      "ResizeObserver loop limit exceeded",
    ],
    // Denylist sensitive URLs from transaction names
    denyUrls: [
      /chrome-extension:\/\//i,
      /moz-extension:\/\//i,
      /safari-extension:\/\//i,
    ],
    // Attach stack traces to all events for better debugging
    attachStacktrace: true,
  });
}