// ============================================================================
// Stripe Configuration Unit Tests
// ============================================================================

import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

// Mock the Stripe constructor - must be constructable since stripe.ts does `new Stripe()`
vi.mock("stripe", () => {
  function MockStripe() {
    return {
      checkout: { sessions: { create: vi.fn() } },
      customers: { list: vi.fn().mockResolvedValue({ data: [] }), create: vi.fn() },
      billingPortal: { sessions: { create: vi.fn() } },
      webhooks: { constructEvent: vi.fn() },
    };
  }
  return { default: MockStripe };
});

// Store original env
const originalEnv = { ...process.env };

describe("Stripe Configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("isStripeConfigured", () => {
    it("should return true when both keys are set", async () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_xxx";
      const { isStripeConfigured } = await import("@/lib/stripe");
      expect(isStripeConfigured()).toBe(true);
    });

    it("should return false when STRIPE_SECRET_KEY is missing", async () => {
      delete process.env.STRIPE_SECRET_KEY;
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_xxx";
      const { isStripeConfigured } = await import("@/lib/stripe");
      expect(isStripeConfigured()).toBe(false);
    });

    it("should return false when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing", async () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      const { isStripeConfigured } = await import("@/lib/stripe");
      expect(isStripeConfigured()).toBe(false);
    });

    it("should return false when both keys are missing", async () => {
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      const { isStripeConfigured } = await import("@/lib/stripe");
      expect(isStripeConfigured()).toBe(false);
    });
  });

  describe("validateStripeConfig", () => {
    it("should return valid: true when all vars are set", async () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_xxx";
      process.env.STRIPE_WEBHOOK_SECRET = "whsec_xxx";
      const { validateStripeConfig } = await import("@/lib/stripe");
      const result = validateStripeConfig();
      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it("should return missing vars when not set", async () => {
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      delete process.env.STRIPE_WEBHOOK_SECRET;
      const { validateStripeConfig } = await import("@/lib/stripe");
      const result = validateStripeConfig();
      expect(result.valid).toBe(false);
      expect(result.missing).toContain("STRIPE_SECRET_KEY");
      expect(result.missing).toContain("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
      expect(result.missing).toContain("STRIPE_WEBHOOK_SECRET");
    });
  });

  describe("SUBSCRIPTION_TIERS", () => {
    it("should define FREE tier with correct limits", async () => {
      const { SUBSCRIPTION_TIERS } = await import("@/lib/stripe");
      const free = SUBSCRIPTION_TIERS.FREE;
      expect(free.id).toBe("free");
      expect(free.price).toBe(0);
      expect(free.limits.properties).toBe(1);
      expect(free.limits.users).toBe(1);
      expect(free.limits.tenants).toBe(5);
    });

    it("should define PRO tier with correct limits", async () => {
      const { SUBSCRIPTION_TIERS } = await import("@/lib/stripe");
      const pro = SUBSCRIPTION_TIERS.PRO;
      expect(pro.id).toBe("pro");
      expect(pro.price).toBe(2900);
      expect(pro.limits.properties).toBe(25);
      expect(pro.limits.users).toBe(5);
      expect(pro.limits.tenants).toBe(-1); // unlimited
    });

    it("should define BUSINESS tier with correct limits", async () => {
      const { SUBSCRIPTION_TIERS } = await import("@/lib/stripe");
      const business = SUBSCRIPTION_TIERS.BUSINESS;
      expect(business.id).toBe("business");
      expect(business.price).toBe(7900);
      expect(business.limits.properties).toBe(100);
      expect(business.limits.users).toBe(20);
      expect(business.limits.tenants).toBe(-1); // unlimited
    });

    it("should have all required fields for each tier", async () => {
      const { SUBSCRIPTION_TIERS } = await import("@/lib/stripe");
      for (const [, tier] of Object.entries(SUBSCRIPTION_TIERS)) {
        expect(tier).toHaveProperty("id");
        expect(tier).toHaveProperty("name");
        expect(tier).toHaveProperty("description");
        expect(tier).toHaveProperty("price");
        expect(tier).toHaveProperty("features");
        expect(tier).toHaveProperty("limits");
        expect(tier.limits).toHaveProperty("properties");
        expect(tier.limits).toHaveProperty("users");
        expect(tier.limits).toHaveProperty("tenants");
        expect(tier.limits).toHaveProperty("storage");
        expect(tier).toHaveProperty("stripePriceId");
      }
    });
  });

  describe("getTier", () => {
    it("should return the FREE tier definition", async () => {
      const { getTier } = await import("@/lib/stripe");
      const tier = getTier("FREE");
      expect(tier.name).toBe("Free");
      expect(tier.price).toBe(0);
    });

    it("should return the PRO tier definition", async () => {
      const { getTier } = await import("@/lib/stripe");
      const tier = getTier("PRO");
      expect(tier.name).toBe("Pro");
      expect(tier.limits.properties).toBe(25);
    });

    it("should return the BUSINESS tier definition", async () => {
      const { getTier } = await import("@/lib/stripe");
      const tier = getTier("BUSINESS");
      expect(tier.name).toBe("Business");
      expect(tier.limits.properties).toBe(100);
    });
  });

  describe("getTrialDays", () => {
    it("should return 14 days for PRO tier", async () => {
      const { getTrialDays } = await import("@/lib/stripe");
      expect(getTrialDays("PRO")).toBe(14);
    });

    it("should return 14 days for BUSINESS tier", async () => {
      const { getTrialDays } = await import("@/lib/stripe");
      expect(getTrialDays("BUSINESS")).toBe(14);
    });

    it("should return 0 days for FREE tier", async () => {
      const { getTrialDays } = await import("@/lib/stripe");
      expect(getTrialDays("FREE")).toBe(0);
    });
  });

  describe("URL helpers", () => {
    it("should return correct success URL with default app URL", async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      const { getCheckoutSuccessUrl } = await import("@/lib/stripe");
      const url = getCheckoutSuccessUrl();
      expect(url).toContain("localhost:3000");
      expect(url).toContain("checkout=success");
    });

    it("should return correct cancel URL with default app URL", async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      const { getCheckoutCancelUrl } = await import("@/lib/stripe");
      const url = getCheckoutCancelUrl();
      expect(url).toContain("localhost:3000");
      expect(url).toContain("checkout=cancelled");
    });

    it("should use custom APP_URL when set", async () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
      const { getCheckoutSuccessUrl, getCheckoutCancelUrl } = await import("@/lib/stripe");
      expect(getCheckoutSuccessUrl()).toContain("https://app.example.com");
      expect(getCheckoutCancelUrl()).toContain("https://app.example.com");
    });

    it("should return correct webhook endpoint URL", async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      const { getWebhookEndpoint } = await import("@/lib/stripe");
      expect(getWebhookEndpoint()).toContain("localhost:3000");
      expect(getWebhookEndpoint()).toContain("/api/stripe/webhook");
    });
  });
});