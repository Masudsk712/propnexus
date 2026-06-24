// ============================================================================
// Stripe Checkout Session — Create subscription checkout
// POST /api/stripe/checkout
// ============================================================================

import { NextResponse } from "next/server";
import { stripe, isStripeConfigured, getTier, getTrialDays, getCheckoutSuccessUrl, getCheckoutCancelUrl } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { captureError } from "@/lib/sentry";

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured. Please set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY." },
        { status: 500 }
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { tierId } = await request.json();
    if (!tierId || !["PRO", "BUSINESS"].includes(tierId)) {
      return NextResponse.json(
        { error: "Invalid subscription tier. Must be 'PRO' or 'BUSINESS'." },
        { status: 400 }
      );
    }

    const tier = getTier(tierId as "PRO" | "BUSINESS");
    const trialDays = getTrialDays(tierId as "PRO" | "BUSINESS");

    // Create or retrieve the Stripe customer
    const customers = await stripe.customers.list({
      email: session.user.email ?? undefined,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: session.user.email ?? undefined,
        name: session.user.name ?? undefined,
        metadata: {
          userId: session.user.id,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: tier.stripePriceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: trialDays > 0 ? trialDays : undefined,
        metadata: {
          userId: session.user.id,
          tierId,
        },
      },
      success_url: getCheckoutSuccessUrl(),
      cancel_url: getCheckoutCancelUrl(),
      metadata: {
        userId: session.user.id,
        tierId,
      },
    });

    logger.info("Checkout session created", {
      context: {
        userId: session.user.id,
        tierId,
        sessionId: checkoutSession.id,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    captureError(error, { route: "/api/stripe/checkout", method: "POST" });
    logger.error("Failed to create checkout session", error instanceof Error ? error : String(error));
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}