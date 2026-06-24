// ============================================================================
// Payments by ID API — GET (single) | PATCH (update)
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

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      tenant: true,
      property: true,
    },
  });

  if (!payment) return notFoundResponse("Payment");

  return successResponse(payment);
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
    const updated = await prisma.payment.update({
      where: { id },
      data: body,
    });

    return successResponse(updated);
  } catch {
    return errorResponse("Invalid request body", 400);
  }
}