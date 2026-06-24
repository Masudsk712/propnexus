// ============================================================================
// Subscription Service — Tier enforcement & billing management
// ============================================================================

import prisma from "@/lib/prisma";
import { SUBSCRIPTION_TIERS, SubscriptionTierId } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { captureError } from "@/lib/sentry";

export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "incomplete_expired";

export interface UserSubscription {
  tier: SubscriptionTierId;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  trialEnd?: Date;
}

/**
 * Get the current subscription for a user.
 * Defaults to FREE tier if no subscription found.
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionCurrentPeriodEnd: true,
      },
    });

    if (!user || !user.subscriptionTier) {
      return getDefaultSubscription();
    }

    return {
      tier: user.subscriptionTier as SubscriptionTierId,
      stripeCustomerId: user.stripeCustomerId ?? undefined,
      stripeSubscriptionId: user.stripeSubscriptionId ?? undefined,
      status: (user.subscriptionStatus as SubscriptionStatus) ?? "active",
      currentPeriodEnd: user.subscriptionCurrentPeriodEnd ?? undefined,
    };
  } catch (error) {
    captureError(error, { route: "subscription.service", method: "getUserSubscription" });
    logger.error("Failed to get user subscription", error instanceof Error ? error : String(error));
    return getDefaultSubscription();
  }
}

function getDefaultSubscription(): UserSubscription {
  return {
    tier: "FREE",
    status: "active",
  };
}

/**
 * Update the subscription for a user after Stripe checkout/ webhook events.
 */
export async function updateUserSubscription(
  userId: string,
  data: {
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    tier: SubscriptionTierId;
    status: SubscriptionStatus;
    currentPeriodEnd?: Date;
  }
): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        subscriptionTier: data.tier,
        subscriptionStatus: data.status,
        subscriptionCurrentPeriodEnd: data.currentPeriodEnd ?? null,
      },
    });
    logger.info("User subscription updated", {
      context: { userId, tier: data.tier, status: data.status },
    });
  } catch (error) {
    captureError(error, { route: "subscription.service", method: "updateUserSubscription" });
    logger.error("Failed to update user subscription", error instanceof Error ? error : String(error));
    throw error;
  }
}

/**
 * Cancel a user's subscription by clearing subscription fields.
 */
export async function cancelUserSubscription(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: "FREE",
        subscriptionStatus: "canceled",
        stripeSubscriptionId: null,
        subscriptionCurrentPeriodEnd: null,
      },
    });
    logger.info("User subscription cancelled", { context: { userId } });
  } catch (error) {
    captureError(error, { route: "subscription.service", method: "cancelUserSubscription" });
    logger.error("Failed to cancel user subscription", error instanceof Error ? error : String(error));
    throw error;
  }
}

/**
 * Update the subscription status for a user (e.g., from webhook events).
 */
export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: SubscriptionStatus,
  currentPeriodEnd?: Date
): Promise<void> {
  try {
    await prisma.user.updateMany({
      where: { stripeSubscriptionId },
      data: {
        subscriptionStatus: status,
        subscriptionCurrentPeriodEnd: currentPeriodEnd ?? null,
      },
    });
    logger.info("Subscription status updated", {
      context: { stripeSubscriptionId, status },
    });
  } catch (error) {
    captureError(error, { route: "subscription.service", method: "updateSubscriptionStatus" });
    logger.error("Failed to update subscription status", error instanceof Error ? error : String(error));
    throw error;
  }
}

/**
 * Check if a user can create a resource based on their tier limits.
 */
export async function checkResourceLimit(
  userId: string,
  resourceType: "properties" | "users" | "tenants",
  currentCount: number
): Promise<{ allowed: boolean; limit: number; tier: string }> {
  const subscription = await getUserSubscription(userId);
  const tier = SUBSCRIPTION_TIERS[subscription.tier];
  const limit = tier.limits[resourceType];

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, limit, tier: subscription.tier };
  }

  return {
    allowed: currentCount < limit,
    limit,
    tier: subscription.tier,
  };
}

/**
 * Get the features available for a user's subscription tier.
 */
export async function getUserFeatures(userId: string): Promise<string[]> {
  const subscription = await getUserSubscription(userId);
  return [...SUBSCRIPTION_TIERS[subscription.tier].features];
}

/**
 * Check if a feature is available for the user's tier.
 */
export async function hasFeature(userId: string, feature: string): Promise<boolean> {
  const features = await getUserFeatures(userId);
  return features.some((f) => f.toLowerCase().includes(feature.toLowerCase()));
}