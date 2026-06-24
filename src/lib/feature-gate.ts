// ============================================================================
// Feature Gate — Server-side subscription enforcement for API routes
// ============================================================================

import { NextResponse } from "next/server";
import { auth as authHandler } from "@/lib/auth";
import { hasFeature } from "@/services/subscription.service";
import { unauthorizedResponse, forbiddenResponse } from "@/lib/auth-helpers";

const auth = authHandler as () => Promise<import("next-auth").Session | null>;

/**
 * Authenticate the user or return a 401 response.
 */
export async function requireAuth(): Promise<NextResponse | { session: Awaited<ReturnType<typeof auth>> }> {
  const session = await auth();
  if (!session?.user) {
    return unauthorizedResponse();
  }
  return { session };
}

/**
 * Require that the current user has a specific subscription feature.
 * Returns a 403 response if the feature is not available on the user's tier.
 */
export async function requireFeature(feature: string): Promise<NextResponse | { session: Awaited<ReturnType<typeof auth>> }> {
  const sessionResult = await requireAuth();
  if (sessionResult instanceof NextResponse) {
    return sessionResult;
  }

  const userId = sessionResult.session?.user?.id;
  if (!userId) {
    return unauthorizedResponse();
  }

  const allowed = await hasFeature(userId, feature);
  if (!allowed) {
    return forbiddenResponse();
  }

  return sessionResult;
}

/**
 * Feature-to-tier mapping for documentation and enforcement.
 * These correspond to features defined in SUBSCRIPTION_TIERS.
 */
export const FEATURE_TIER_MAP = {
  "Analytics dashboard": "PRO",
  "Maintenance management": "PRO",
  "Payment collection": "PRO",
  "Payment auto-collection": "BUSINESS",
  "White-labeling": "BUSINESS",
  "API access": "BUSINESS",
  "2FA enforcement": "BUSINESS",
  "Priority support": "BUSINESS",
  "Advanced analytics": "PRO",
  "Premium reports": "BUSINESS",
  "Bulk operations": "PRO",
  "Vendor management": "PRO",
  "AI features": "BUSINESS",
  "Export features": "PRO",
} as const;

export type FeatureName = keyof typeof FEATURE_TIER_MAP;