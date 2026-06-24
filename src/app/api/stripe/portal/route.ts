// ============================================================================
// Stripe Billing Portal — Manage subscription & billing
// POST /api/stripe/portal
// ============================================================================

import { NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { captureError } from "@/lib/sentry";

export async function POST() {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
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

    // Find the Stripe customer for this user
    const customers = await stripe.customers.list({
      email: session.user.email ?? undefined,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json(
        { error: "No billing account found" },
        { status: 404 }
      );
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: process.env.NEXT_PUBLIC_APP_URL
        ? process.env.NEXT_PUBLIC_APP_URL + "/dashboard/settings/billing"
        : "http://localhost:3000/dashboard/settings/billing",
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    captureError(error, { route: "/api/stripe/portal", method: "POST" });
    logger.error("Failed to create billing portal session", error instanceof Error ? error : String(error));
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}