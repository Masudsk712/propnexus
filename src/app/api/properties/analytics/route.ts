// ============================================================================
// Property Analytics API — GET analytics data for the property dashboard
// ============================================================================

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { unauthorizedResponse, successResponse, errorResponse, forbiddenResponse } from "@/lib/auth-helpers";
import { propertyService } from "@/services";
import { requireFeature } from "@/lib/feature-gate";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const featureResult = await requireFeature("Analytics dashboard");
  if ("error" in featureResult) return featureResult.error! as ReturnType<typeof forbiddenResponse>;

  const result = await propertyService.getAnalytics();
  if (!result.success) return errorResponse(result.error ?? "Failed to fetch analytics", 500);
  return successResponse(result.data);
}