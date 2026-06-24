// ============================================================================
// Auth Service Unit Tests
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    verificationToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
  buildPasswordResetEmail: vi.fn((link: string) => `<p>Reset link: ${link}</p>`),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

describe("Auth Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("registerUser", () => {
    it("should register a new user successfully", async () => {
      const mockUser = {
        id: "usr_123",
        name: "Test User",
        email: "test@example.com",
        role: "tenant",
        createdAt: new Date("2024-01-01"),
        password: "$2a$12$hashedpassword",
        phone: null,
        image: null,
        emailVerified: null,
        updatedAt: new Date("2024-01-01"),
        subscriptionTier: "FREE",
        subscriptionStatus: "active",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionCurrentPeriodEnd: null,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser);
      vi.mocked(prisma.notification.create).mockResolvedValue({} as any);
      vi.mocked(prisma.activityLog.create).mockResolvedValue({} as any);

      const { registerUser } = await import("@/services/auth.service");
      const result = await registerUser({
        name: "Test User",
        email: "test@example.com",
        password: "Password123!",
      });

      expect(result).toBeDefined();
      expect(result.id).toBe("usr_123");
      expect(result.name).toBe("Test User");
      expect(result.email).toBe("test@example.com");
      expect(result.role).toBe("tenant");
    });

    it("should throw error if user already exists", async () => {
      const existingUser = {
        id: "usr_existing",
        name: "Existing User",
        email: "existing@example.com",
        role: "tenant",
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as any);

      const { registerUser } = await import("@/services/auth.service");
      await expect(
        registerUser({
          name: "Test User",
          email: "existing@example.com",
          password: "Password123!",
        })
      ).rejects.toThrow("A user with this email already exists");
    });

    it("should normalize email to lowercase", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "usr_123",
        name: "Test User",
        email: "test@example.com",
        role: "tenant",
        createdAt: new Date("2024-01-01"),
      } as any);

      const { registerUser } = await import("@/services/auth.service");
      const result = await registerUser({
        name: "Test User",
        email: "TEST@EXAMPLE.COM",
        password: "Password123!",
      });

      expect(result.email).toBe("test@example.com");
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
    });
  });

  describe("forgotPassword", () => {
    it("should return success message even if user not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const { forgotPassword } = await import("@/services/auth.service");
      const result = await forgotPassword("nonexistent@example.com");

      expect(result.success).toBe(true);
      expect(result.message).toContain("If an account with that email exists");
    });

    it("should create verification token and send email for existing user", async () => {
      const mockUser = {
        id: "usr_123",
        name: "Test User",
        email: "test@example.com",
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.verificationToken.deleteMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(prisma.verificationToken.create).mockResolvedValue({
        id: "vt_1",
        identifier: "test@example.com",
        token: "mock-token",
        expires: new Date(Date.now() + 3600000),
      } as any);
      vi.mocked(sendEmail).mockResolvedValue(true);

      const { forgotPassword } = await import("@/services/auth.service");
      const result = await forgotPassword("test@example.com");

      expect(result.success).toBe(true);
      expect(prisma.verificationToken.deleteMany).toHaveBeenCalled();
      expect(prisma.verificationToken.create).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    it("should throw error for invalid token", async () => {
      vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue(null);

      const { resetPassword } = await import("@/services/auth.service");
      await expect(
        resetPassword({ token: "invalid", password: "NewPass123!" })
      ).rejects.toThrow("Invalid or expired reset token");
    });

    it("should throw error for expired token", async () => {
      const expiredToken = {
        id: "vt_expired",
        identifier: "test@example.com",
        token: "expired-token",
        expires: new Date(Date.now() - 3600000), // 1 hour ago
      };

      vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue(expiredToken as any);

      const { resetPassword } = await import("@/services/auth.service");
      await expect(
        resetPassword({ token: "expired-token", password: "NewPass123!" })
      ).rejects.toThrow("Invalid or expired reset token");
    });
  });

  describe("verifyEmail", () => {
    it("should throw error for invalid verification token", async () => {
      vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue(null);

      const { verifyEmail } = await import("@/services/auth.service");
      await expect(verifyEmail("invalid-token")).rejects.toThrow(
        "Invalid or expired verification token"
      );
    });
  });
});