// ============================================================================
// Properties API — GET (list) | POST (create)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { unauthorizedResponse, forbiddenResponse, successResponse, errorResponse } from "@/lib/auth-helpers";
import { createPropertySchema } from "@/validations";
import { propertyService } from "@/services";
import { checkResourceLimit } from "@/services/subscription.service";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);

  const result = await propertyService.getAll({ page, limit });
  if (!result.success) return errorResponse(result.error ?? "Failed to fetch properties", 500);
  return successResponse(result.data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const role = session.user.role;
  if (role !== "admin" && role !== "manager") return forbiddenResponse();

  // Subscription enforcement: check property limit per-user
  const propertyCount = await prisma.property.count({ where: { userId: session.user.id } });
  const limitCheck = await checkResourceLimit(
    session.user.id,
    "properties",
    propertyCount
  );
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Your ${limitCheck.tier} plan is limited to ${limitCheck.limit} properties. Please upgrade to create more.`,
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = createPropertySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await propertyService.create(parsed.data);
    if (!result.success) return errorResponse(result.error ?? "Failed to create property", 400);

    return successResponse(result.data, 201);
  } catch {
    return errorResponse("Invalid request body", 400);
  }
}