// ============================================================================
// Subscription Service Unit Tests
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock stripe globally - must be a constructable function
vi.mock("stripe", () => {
  return {
    default: function MockStripe() {
      return {
        checkout: { sessions: { create: vi.fn() } },
        customers: { list: vi.fn().mockResolvedValue({ data: [] }), create: vi.fn() },
        billingPortal: { sessions: { create: vi.fn() } },
        webhooks: { constructEvent: vi.fn() },
      };
    },
  };
});

// Use vi.hoisted to define variables that can be used in vi.mock factories
const mockFindUnique = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockUpdateMany = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: mockFindUnique,
      update: mockUpdate,
      updateMany: mockUpdateMany,
    },
  },
}));

// Mock Sentry
vi.mock("@/lib/sentry", () => ({
  captureError: vi.fn(),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { getUserSubscription, checkResourceLimit, updateUserSubscription, cancelUserSubscription, updateSubscriptionStatus } from "@/services/subscription.service";

describe("Subscription Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserSubscription", () => {
    it("should return FREE tier for user without subscription", async () => {
      mockFindUnique.mockResolvedValue({
        id: "usr_123",
        subscriptionTier: null,
        subscriptionStatus: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionCurrentPeriodEnd: null,
      });

      const result = await getUserSubscription("usr_123");
      expect(result.tier).toBe("FREE");
      expect(result.status).toBe("active");
    });

    it("should return default subscription when user not found", async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await getUserSubscription("non_existent");
      expect(result.tier).toBe("FREE");
      expect(result.status).toBe("active");
    });

    it("should return PRO tier for PRO user", async () => {
      mockFindUnique.mockResolvedValue({
        id: "usr_123",
        subscriptionTier: "PRO",
        subscriptionStatus: "active",
        stripeCustomerId: "cus_xxx",
        stripeSubscriptionId: "sub_xxx",
        subscriptionCurrentPeriodEnd: new Date("2026-12-31"),
      });

      const result = await getUserSubscription("usr_123");
      expect(result.tier).toBe("PRO");
      expect(result.status).toBe("active");
      expect(result.stripeCustomerId).toBe("cus_xxx");
      expect(result.stripeSubscriptionId).toBe("sub_xxx");
      expect(result.currentPeriodEnd).toBeDefined();
    });

    it("should return BUSINESS tier for BUSINESS user", async () => {
      mockFindUnique.mockResolvedValue({
        id: "usr_456",
        subscriptionTier: "BUSINESS",
        subscriptionStatus: "active",
        stripeCustomerId: "cus_yyy",
        stripeSubscriptionId: "sub_yyy",
        subscriptionCurrentPeriodEnd: null,
      });

      const result = await getUserSubscription("usr_456");
      expect(result.tier).toBe("BUSINESS");
      expect(result.status).toBe("active");
    });

    it("should handle canceled subscription status", async () => {
      mockFindUnique.mockResolvedValue({
        id: "usr_789",
        subscriptionTier: "PRO",
        subscriptionStatus: "canceled",
        stripeCustomerId: "cus_zzz",
        stripeSubscriptionId: "sub_zzz",
        subscriptionCurrentPeriodEnd: null,
      });

      const result = await getUserSubscription("usr_789");
      expect(result.tier).toBe("PRO");
      expect(result.status).toBe("canceled");
    });

    it("should handle database errors gracefully by returning FREE tier", async () => {
      mockFindUnique.mockRejectedValue(new Error("DB connection error"));

      const result = await getUserSubscription("usr_error");
      expect(result.tier).toBe("FREE");
      expect(result.status).toBe("active");
    });
  });

  describe("checkResourceLimit", () => {
    it("should allow resource creation within limits", async () => {
      mockFindUnique.mockResolvedValue({
        id: "usr_123",
        subscriptionTier: "FREE",
        subscriptionStatus: "active",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionCurrentPeriodEnd: null,
      });

      const result = await checkResourceLimit("usr_123", "properties", 0);
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(1);
      expect(result.tier).toBe("FREE");
    });

    it("should deny resource creation when at limit", async () => {
      mockFindUnique.mockResolvedValue({
        id: "usr_123",
        subscriptionTier: "FREE",
        subscriptionStatus: "active",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionCurrentPeriodEnd: null,
      });

      const result = await checkResourceLimit("usr_123", "properties", 1);
      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(1);
    });

    it("should allow unlimited resources when limit is -1", async () => {
      mockFindUnique.mockResolvedValue({
        id: "usr_456",
        subscriptionTier: "PRO",
        subscriptionStatus: "active",
        stripeCustomerId: "cus_yyy",
        stripeSubscriptionId: "sub_yyy",
        subscriptionCurrentPeriodEnd: null,
      });

      const result = await checkResourceLimit("usr_456", "tenants", 1000);
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(-1);
    });

    it("should use FREE tier limits when user has no subscription", async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await checkResourceLimit("non_existent", "users", 5);
      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(1);
    });
  });

  describe("updateUserSubscription", () => {
    it("should update user with subscription data", async () => {
      mockUpdate.mockResolvedValue({ id: "usr_123" });

      await updateUserSubscription("usr_123", {
        stripeCustomerId: "cus_new",
        stripeSubscriptionId: "sub_new",
        tier: "PRO",
        status: "active",
        currentPeriodEnd: new Date("2027-01-01"),
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "usr_123" },
        data: {
          stripeCustomerId: "cus_new",
          stripeSubscriptionId: "sub_new",
          subscriptionTier: "PRO",
          subscriptionStatus: "active",
          subscriptionCurrentPeriodEnd: expect.any(Date),
        },
      });
    });

    it("should set subscriptionCurrentPeriodEnd to null when not provided", async () => {
      mockUpdate.mockResolvedValue({ id: "usr_123" });

      await updateUserSubscription("usr_123", {
        stripeCustomerId: "cus_new",
        stripeSubscriptionId: "sub_new",
        tier: "FREE",
        status: "active",
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "usr_123" },
        data: {
          stripeCustomerId: "cus_new",
          stripeSubscriptionId: "sub_new",
          subscriptionTier: "FREE",
          subscriptionStatus: "active",
          subscriptionCurrentPeriodEnd: null,
        },
      });
    });

    it("should throw error when DB update fails", async () => {
      mockUpdate.mockRejectedValue(new Error("Update failed"));

      await expect(
        updateUserSubscription("usr_123", {
          stripeCustomerId: "cus_err",
          stripeSubscriptionId: "sub_err",
          tier: "PRO",
          status: "active",
        })
      ).rejects.toThrow("Update failed");
    });
  });

  describe("cancelUserSubscription", () => {
    it("should reset subscription to FREE with canceled status", async () => {
      mockUpdate.mockResolvedValue({ id: "usr_123" });

      await cancelUserSubscription("usr_123");

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "usr_123" },
        data: {
          subscriptionTier: "FREE",
          subscriptionStatus: "canceled",
          stripeSubscriptionId: null,
          subscriptionCurrentPeriodEnd: null,
        },
      });
    });
  });

  describe("updateSubscriptionStatus", () => {
    it("should update subscription status by stripe subscription ID", async () => {
      mockUpdateMany.mockResolvedValue({ count: 1 });

      await updateSubscriptionStatus("sub_xxx", "past_due", new Date("2026-07-01"));

      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: "sub_xxx" },
        data: {
          subscriptionStatus: "past_due",
          subscriptionCurrentPeriodEnd: expect.any(Date),
        },
      });
    });
  });
});