// ============================================================================
// Rent Payment History — List payment history for the current tenant user
// GET /api/rent/payments
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

  // Only tenants can view their own payment history via this endpoint
  if (role !== "tenant") return forbiddenResponse();

  const result = await rentalPaymentService.getPaymentHistory(userId);
  if (!result.success) return errorResponse(result.error ?? "Failed to fetch payment history", 500);

  return successResponse(result.data);
}