// ============================================================================
// Sentry Utility Unit Tests
// ============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock @sentry/nextjs
vi.mock("@sentry/nextjs", () => ({
  default: {
    captureException: vi.fn(),
    setUser: vi.fn(),
    addBreadcrumb: vi.fn(),
  },
  captureException: vi.fn(),
  setUser: vi.fn(),
  addBreadcrumb: vi.fn(),
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

const originalEnv = { ...process.env };

describe("Sentry Utility", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("isSentryConfigured", () => {
    it("should return true when DSN is set", async () => {
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://xxx@xxx.ingest.us.sentry.io/xxx";
      const { isSentryConfigured } = await import("@/lib/sentry");
      expect(isSentryConfigured()).toBe(true);
    });

    it("should return false when DSN is missing", async () => {
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;
      const { isSentryConfigured } = await import("@/lib/sentry");
      expect(isSentryConfigured()).toBe(false);
    });
  });

  describe("validateSentryConfig", () => {
    it("should return valid: true when all vars are set", async () => {
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://xxx@xxx.ingest.us.sentry.io/xxx";
      process.env.SENTRY_ORG = "test-org";
      process.env.SENTRY_PROJECT = "test-project";
      const { validateSentryConfig } = await import("@/lib/sentry");
      const result = validateSentryConfig();
      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it("should return missing vars when DSN is not set", async () => {
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;
      process.env.SENTRY_ORG = "test-org";
      process.env.SENTRY_PROJECT = "test-project";
      const { validateSentryConfig } = await import("@/lib/sentry");
      const result = validateSentryConfig();
      expect(result.valid).toBe(false);
      expect(result.missing).toContain("NEXT_PUBLIC_SENTRY_DSN");
    });
  });

  describe("captureError", () => {
    it("should capture an exception with Sentry when DSN is set", async () => {
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://xxx@xxx.ingest.us.sentry.io/xxx";
      const Sentry = await import("@sentry/nextjs");
      const { captureError } = await import("@/lib/sentry");

      const testError = new Error("Test error");
      captureError(testError, { route: "/api/test", method: "POST" });

      expect(Sentry.captureException).toHaveBeenCalledWith(testError, {
        tags: { route: "/api/test", method: "POST" },
        user: undefined,
      });
    });

    it("should capture error with user context when userId provided", async () => {
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://xxx@xxx.ingest.us.sentry.io/xxx";
      const Sentry = await import("@sentry/nextjs");
      const { captureError } = await import("@/lib/sentry");

      const testError = new Error("User-specific error");
      captureError(testError, { route: "/api/test", method: "GET", userId: "usr_123" });

      expect(Sentry.captureException).toHaveBeenCalledWith(testError, {
        tags: { route: "/api/test", method: "GET" },
        user: { id: "usr_123" },
      });
    });

    it("should not call Sentry when DSN is not configured", async () => {
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;
      const Sentry = await import("@sentry/nextjs");
      const { captureError } = await import("@/lib/sentry");

      captureError(new Error("Should not be sent"));

      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it("should handle string errors", async () => {
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://xxx@xxx.ingest.us.sentry.io/xxx";
      const Sentry = await import("@sentry/nextjs");
      const { captureError } = await import("@/lib/sentry");

      captureError("String error message");

      expect(Sentry.captureException).toHaveBeenCalledWith("String error message", {
        tags: { route: "unknown", method: "unknown" },
        user: undefined,
      });
    });
  });

  describe("setSentryUser", () => {
    it("should set user context in Sentry", async () => {
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://xxx@xxx.ingest.us.sentry.io/xxx";
      const Sentry = await import("@sentry/nextjs");
      const { setSentryUser } = await import("@/lib/sentry");

      setSentryUser({ id: "usr_123", email: "user@example.com", role: "admin" });

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: "usr_123",
        email: "user@example.com",
        role: "admin",
      });
    });

    it("should not call Sentry when DSN is not configured", async () => {
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;
      const Sentry = await import("@sentry/nextjs");
      const { setSentryUser } = await import("@/lib/sentry");

      setSentryUser({ id: "usr_123" });

      expect(Sentry.setUser).not.toHaveBeenCalled();
    });
  });

  describe("clearSentryUser", () => {
    it("should clear user context in Sentry", async () => {
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://xxx@xxx.ingest.us.sentry.io/xxx";
      const Sentry = await import("@sentry/nextjs");
      const { clearSentryUser } = await import("@/lib/sentry");

      clearSentryUser();

      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });

    it("should not call Sentry when DSN is not configured", async () => {
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;
      const Sentry = await import("@sentry/nextjs");
      const { clearSentryUser } = await import("@/lib/sentry");

      clearSentryUser();

      expect(Sentry.setUser).not.toHaveBeenCalled();
    });
  });

  describe("logUserAction", () => {
    it("should add a breadcrumb when DSN is set", async () => {
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://xxx@xxx.ingest.us.sentry.io/xxx";
      const Sentry = await import("@sentry/nextjs");
      const { logUserAction } = await import("@/lib/sentry");

      logUserAction("User logged in", { method: "credentials" });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: "user-action",
        message: "User logged in",
        data: { method: "credentials" },
        level: "info",
      });
    });

    it("should not add breadcrumb when DSN is not configured", async () => {
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;
      const Sentry = await import("@sentry/nextjs");
      const { logUserAction } = await import("@/lib/sentry");

      logUserAction("Some action");

      expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();
    });
  });
});