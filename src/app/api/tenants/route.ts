// ============================================================================
// Tenants API — GET (list) | POST (create)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { unauthorizedResponse, forbiddenResponse, successResponse, errorResponse } from "@/lib/auth-helpers";
import { createTenantSchema } from "@/validations";
import { tenantService } from "@/services";
import { checkResourceLimit } from "@/services/subscription.service";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  // Restrict list to admin/manager only — tenant data is sensitive
  const role = session.user.role;
  if (role !== "admin" && role !== "manager") return forbiddenResponse();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);

  const result = await tenantService.getAll({ page, limit });
  if (!result.success) return errorResponse(result.error ?? "Failed to fetch tenants", 500);
  return successResponse(result.data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();
  const role = session.user.role;
  if (role !== "admin" && role !== "manager") return forbiddenResponse();

  // Subscription enforcement: check tenant limit (per-user)
  const tenantCount = await prisma.tenant.count({ where: { userId: session.user.id } });
  const limitCheck = await checkResourceLimit(
    session.user.id,
    "tenants",
    tenantCount
  );
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Your ${limitCheck.tier} plan is limited to ${limitCheck.limit} tenants. Please upgrade to create more.`,
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = createTenantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const result = await tenantService.create(parsed.data);
    if (!result.success) return errorResponse(result.error ?? "Failed to create tenant", 400);
    return successResponse(result.data, 201);
  } catch {
    return errorResponse("Invalid request body", 400);
  }
}