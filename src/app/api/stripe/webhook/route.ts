// ============================================================================
// Stripe Webhook — Handle subscription lifecycle events
// POST /api/stripe/webhook
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { captureError } from "@/lib/sentry";
import prisma from "@/lib/prisma";
import {
  updateUserSubscription,
  cancelUserSubscription,
  updateSubscriptionStatus,
  SubscriptionStatus,
} from "@/services/subscription.service";

export const dynamic = "force-dynamic";

/**
 * Handle Stripe webhook events for subscription lifecycle.
 * This is the server-to-server event handler for billing automation.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  // Verify webhook signature
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    captureError(err, { route: "/api/stripe/webhook", method: "POST" });
    logger.error("Webhook signature verification failed", err instanceof Error ? err : String(err));
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  logger.info("Stripe webhook received", {
    context: { type: event.type, id: event.id },
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const type = session.metadata?.type;

        // Handle rent payment checkout
        if (type === "rent") {
          const invoiceId = session.metadata?.invoiceId;
          const tenantId = session.metadata?.tenantId;
          const userId = session.metadata?.userId;

          if (invoiceId && userId) {
            logger.info("Rent payment checkout completed", {
              context: { invoiceId, userId, amount: session.amount_total },
            });
            try {
              const { rentalPaymentService } = await import("@/services");
              await rentalPaymentService.handlePaymentSuccess(invoiceId, {
                id: session.id,
                payment_intent: session.payment_intent,
                payment_status: session.payment_status,
                amount_total: session.amount_total,
              });
              logger.info("Invoice marked as paid", { context: { invoiceId } });
            } catch (err) {
              captureError(err, { route: "/api/stripe/webhook", method: "POST" });
              logger.error("Failed to process rent payment", err instanceof Error ? err : String(err));
            }
          } else {
            logger.warn("Rent checkout completed but missing metadata", {
              context: { invoiceId, tenantId, userId },
            });
          }
          break;
        }

        // Handle subscription checkout (existing logic)
        const subUserId = session.metadata?.userId;
        const tierId = session.metadata?.tierId;
        const subscriptionId = session.subscription;
        const customerId = session.customer;

        if (subUserId && tierId && subscriptionId && customerId) {
          await updateUserSubscription(subUserId, {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            tier: tierId,
            status: "active",
            currentPeriodEnd: session.expires_at
              ? new Date(session.expires_at * 1000)
              : undefined,
          });
        } else {
          logger.warn("Checkout session completed but missing metadata", {
            context: { userId: subUserId, tierId, subscriptionId, customerId },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const subscriptionUserId = subscription.metadata?.userId;

        if (subscriptionUserId) {
          await updateSubscriptionStatus(
            subscription.id,
            subscription.status as SubscriptionStatus,
            subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : undefined
          );
        } else {
          // Try to find user by stripe customer ID
          const customerId = subscription.customer;
          const users = await prisma.user.findMany({
            where: { stripeCustomerId: customerId },
            take: 1,
          });
          if (users.length > 0) {
            await updateSubscriptionStatus(
              subscription.id,
              subscription.status as SubscriptionStatus,
              subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : undefined
            );
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const deletedSub = event.data.object as any;
        const deletedUserId = deletedSub.metadata?.userId;

        if (deletedUserId) {
          await cancelUserSubscription(deletedUserId);
        } else {
          const customerId = deletedSub.customer;
          const users = await prisma.user.findMany({
            where: { stripeCustomerId: customerId },
            take: 1,
          });
          if (users.length > 0) {
            await cancelUserSubscription(users[0].id);
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        const invoiceUserId = invoice.metadata?.userId;

        if (invoiceUserId) {
          logger.info("Invoice payment succeeded", {
            context: { userId: invoiceUserId, amount: invoice.amount_paid },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const failedInvoice = event.data.object as any;
        const failedUserId = failedInvoice.metadata?.userId;

        if (failedUserId) {
          logger.warn("Invoice payment failed", {
            context: { userId: failedUserId, amount: failedInvoice.amount_due },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    captureError(error, { route: "/api/stripe/webhook", method: "POST" });
    logger.error("Webhook handler error", error instanceof Error ? error : String(error));
    return NextResponse.json(
      { error: "Webhook handler error" },
      { status: 500 }
    );
  }
}