// ============================================================================
// Rent Invoices — List invoices for the current tenant user
// GET /api/rent/invoices
// ============================================================================

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { unauthorizedResponse, forbiddenResponse, errorResponse, successResponse } from "@/lib/auth-helpers";
import { rentalPaymentService } from "@/services";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const userId = session.user.id;
  const role = (session.user as any).role;

  // Only tenants can view their own invoices via this endpoint
  // Admin/manager can use the general payments API
  if (role !== "tenant") return forbiddenResponse();

  const result = await rentalPaymentService.getUserInvoices(userId);
  if (!result.success) return errorResponse(result.error ?? "Failed to fetch invoices", 500);

  return successResponse(result.data);
}