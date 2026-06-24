// ============================================================================
// Vitest Global Setup — Ensures environment variables are set before tests run
// ============================================================================

// Stripe module creates a new Stripe() instance at import time, so we need
// a dummy key to prevent "Neither apiKey nor config.authenticator provided" errors
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_for_tests";

// Set other common env vars that modules may check at import time
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder";