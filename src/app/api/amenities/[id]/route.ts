// ============================================================================
// Amenities by ID API — PATCH (update) | DELETE (remove)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { unauthorizedResponse, forbiddenResponse, notFoundResponse, successResponse, errorResponse } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const role = session.user.role;
  if (role !== "admin" && role !== "manager") return forbiddenResponse();

  const { id } = await params;

  const amenity = await prisma.amenity.findUnique({
    where: { id },
  });

  if (!amenity) return notFoundResponse("Amenity");

  try {
    const body = await request.json();
    const updated = await prisma.amenity.update({
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

  // Delete amenity — admin only
  const role = session.user.role;
  if (role !== "admin") return forbiddenResponse();

  const { id } = await params;

  const amenity = await prisma.amenity.findUnique({
    where: { id },
  });

  if (!amenity) return notFoundResponse("Amenity");

  // Hard delete
  await prisma.amenity.delete({
    where: { id },
  });

  return successResponse({ deleted: true });
}