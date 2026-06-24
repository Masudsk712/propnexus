// ============================================================================
// Tenants by ID API — GET (single) | PATCH (update) | DELETE (remove)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { unauthorizedResponse, forbiddenResponse, notFoundResponse, successResponse, errorResponse } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      user: true,
      property: true,
    },
  });

  if (!tenant) return notFoundResponse("Tenant");

  return successResponse(tenant);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const role = session.user.role;
  if (role !== "admin" && role !== "manager") return forbiddenResponse();

  const { id } = await params;

  try {
    const body = await request.json();
    const updated = await prisma.tenant.update({
      where: { id },
      data: body,
    });

    return successResponse(updated);
  } catch {
    return errorResponse("Invalid request body", 400);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const role = session.user.role;
  if (role !== "admin") return forbiddenResponse();

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
  });

  if (!tenant) return notFoundResponse("Tenant");

  await prisma.tenant.delete({
    where: { id },
  });

  return successResponse({ deleted: true });
}