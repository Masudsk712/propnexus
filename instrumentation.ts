// ============================================================================
// Sentry Instrumentation — Required by @sentry/nextjs
// Validates environment config at startup.
// The actual Sentry.init() is handled by sentry.client.config.ts
// and sentry.server.config.ts.
// ============================================================================

export async function register() {
  // Validate required environment variables at startup
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // Warn about missing Sentry DSN in production
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      console.warn(
        "[INSTRUMENTATION] NEXT_PUBLIC_SENTRY_DSN not set — Sentry error tracking disabled in production!"
      );
    }

    // Warn about missing Resend API key
    if (!process.env.RESEND_API_KEY) {
      console.warn(
        "[INSTRUMENTATION] RESEND_API_KEY not set — email sending disabled in production!"
      );
    }
  }
}