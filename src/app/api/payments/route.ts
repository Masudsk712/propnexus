// ============================================================================
// Payments API — GET (list) | POST (create)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { unauthorizedResponse, forbiddenResponse, successResponse, errorResponse } from "@/lib/auth-helpers";
import { createPaymentSchema } from "@/validations";
import { paymentService } from "@/services";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);

  const result = await paymentService.getAll({ page, limit });
  if (!result.success) return errorResponse(result.error ?? "Failed to fetch payments", 500);
  return successResponse(result.data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();
  const role = session.user.role;
  if (role !== "admin" && role !== "manager") return forbiddenResponse();

  try {
    const body = await req.json();
    const parsed = createPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const result = await paymentService.create(parsed.data);
    if (!result.success) return errorResponse(result.error ?? "Failed to create payment", 400);
    return successResponse(result.data, 201);
  } catch {
    return errorResponse("Invalid request body", 400);
  }
}