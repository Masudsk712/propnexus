// ============================================================================
// Rent Checkout — Creates Stripe Checkout Session for rent payment
// POST /api/rent/checkout
// ============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { unauthorizedResponse, forbiddenResponse, errorResponse, successResponse } from "@/lib/auth-helpers";
import { rentalPaymentService } from "@/services";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse();

    const userId = session.user.id;
    const role = (session.user as any).role;

    // Only tenants can pay rent
    if (role !== "tenant") return forbiddenResponse();

    const body = await request.json();
    const { invoiceId, tenantId, amount, propertyName, description } = body;

    if (!invoiceId || !tenantId || !amount || !propertyName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: invoiceId, tenantId, amount, propertyName" },
        { status: 400 }
      );
    }

    // Security: tenant can only pay their own invoices
    // Verify the invoice belongs to this user's tenant
    const invoice = await rentalPaymentService.getInvoiceById(invoiceId);
    if (!invoice.success || !invoice.data) {
      return errorResponse("Invoice not found", 404);
    }

    const invoiceData = invoice.data as any;

    // Verify the invoice belongs to this user
    if (invoiceData.userId !== userId && invoiceData.tenant?.userId !== userId) {
      return forbiddenResponse();
    }

    const result = await rentalPaymentService.createCheckoutSession({
      invoiceId,
      tenantId,
      userId,
      amount,
      propertyName,
      description,
    });

    if (!result.success) {
      return errorResponse(result.error ?? "Failed to create checkout session", 500);
    }

    return successResponse(result.data);
  } catch (error) {
    console.error("[RENT_CHECKOUT]", error);
    return errorResponse("Internal server error", 500);
  }
}