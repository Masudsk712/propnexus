// ============================================================================
// Stripe Configuration — Payment Processing & Subscription Management
// ============================================================================

import Stripe from "stripe";

/**
 * Stripe server-side instance.
 * Use this in API routes and server components.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-03-31.basil" as any,
  typescript: true,
  appInfo: {
    name: "Unified Property Management",
    version: "1.0.0",
  },
});

/**
 * Check if Stripe is properly configured.
 */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}

/**
 * Validate Stripe environment variables.
 */
export function validateStripeConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  const isProduction = process.env.NODE_ENV === "production";

  if (!process.env.STRIPE_SECRET_KEY) {
    missing.push("STRIPE_SECRET_KEY");
  }
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    missing.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    missing.push("STRIPE_WEBHOOK_SECRET");
  }

  if (missing.length > 0 && isProduction) {
    console.warn("[STRIPE] Missing configuration: " + missing.join(", "));
  }

  return { valid: missing.length === 0, missing };
}

/**
 * Subscription tier definitions.
 * These map to Stripe Price IDs in production.
 */
export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: "free",
    name: "Free",
    description: "Basic property management for individual landlords",
    price: 0,
    features: [
      "1 property",
      "1 user",
      "Up to 5 tenants",
      "Basic maintenance tracking",
    ],
    limits: {
      properties: 1,
      users: 1,
      tenants: 5,
      storage: 100,
    },
    stripePriceId: process.env.STRIPE_PRICE_FREE ?? "price_free",
  },
  PRO: {
    id: "pro",
    name: "Pro",
    description: "Full features for professional property managers",
    price: 2900,
    features: [
      "25 properties",
      "5 users",
      "Unlimited tenants",
      "Payment collection",
      "Maintenance management",
      "Analytics dashboard",
      "Email notifications",
    ],
    limits: {
      properties: 25,
      users: 5,
      tenants: -1,
      storage: 1024,
    },
    stripePriceId: process.env.STRIPE_PRICE_PRO ?? "price_pro",
  },
  BUSINESS: {
    id: "business",
    name: "Business",
    description: "Advanced tools for growing property management firms",
    price: 7900,
    features: [
      "100 properties",
      "20 users",
      "Unlimited tenants",
      "Payment auto-collection",
      "White-labeling",
      "API access",
      "2FA enforcement",
      "Priority support",
    ],
    limits: {
      properties: 100,
      users: 20,
      tenants: -1,
      storage: 5120,
    },
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS ?? "price_business",
  },
} as const;

export type SubscriptionTierId = keyof typeof SUBSCRIPTION_TIERS;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[SubscriptionTierId];

/**
 * Get a subscription tier by its ID.
 */
export function getTier(tierId: SubscriptionTierId): SubscriptionTier {
  return SUBSCRIPTION_TIERS[tierId];
}

/**
 * Get trial period days for a tier.
 */
export function getTrialDays(tierId: SubscriptionTierId): number {
  if (tierId === "PRO") return 14;
  if (tierId === "BUSINESS") return 14;
  return 0;
}

/**
 * The URL to redirect to after successful checkout.
 */
export function getCheckoutSuccessUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return baseUrl + "/dashboard?checkout=success";
}

/**
 * The URL to redirect to after cancelled checkout.
 */
export function getCheckoutCancelUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return baseUrl + "/pricing?checkout=cancelled";
}

/**
 * The URL for Stripe webhook endpoint.
 */
export function getWebhookEndpoint(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return baseUrl + "/api/stripe/webhook";
}