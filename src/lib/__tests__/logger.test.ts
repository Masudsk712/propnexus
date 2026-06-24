// ============================================================================
// Logger Unit Tests
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock environment before importing logger
vi.stubEnv("NODE_ENV", "test");
vi.stubEnv("LOG_LEVEL", "debug");

describe("Logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should export logger object with all log methods", async () => {
    const { logger } = await import("@/lib/logger");
    expect(logger).toBeDefined();
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
  });

  it("should export createRequestLogger function", async () => {
    const { createRequestLogger } = await import("@/lib/logger");
    expect(createRequestLogger).toBeDefined();
    expect(typeof createRequestLogger).toBe("function");
  });

  it("createRequestLogger should return child logger with methods", async () => {
    const { createRequestLogger } = await import("@/lib/logger");
    const child = createRequestLogger({
      requestId: "req_123",
      path: "/api/test",
      method: "GET",
    });
    expect(child).toBeDefined();
    expect(typeof child.info).toBe("function");
    expect(typeof child.error).toBe("function");
    expect(typeof child.warn).toBe("function");
    expect(typeof child.debug).toBe("function");
    expect(typeof child.request).toBe("function");
  });

  it("createRequestLogger request() method should not throw", async () => {
    const { createRequestLogger } = await import("@/lib/logger");
    const child = createRequestLogger({
      requestId: "req_123",
      path: "/api/test",
      method: "GET",
    });
    expect(() => child.request(200, 50)).not.toThrow();
    expect(() => child.request(404, 30)).not.toThrow();
    expect(() => child.request(500, 100)).not.toThrow();
  });

  it("logger.error should handle Error objects", async () => {
    const { logger } = await import("@/lib/logger");
    const error = new Error("Test error");
    expect(() => logger.error("Error occurred", error)).not.toThrow();
  });

  it("logger.error should handle string errors", async () => {
    const { logger } = await import("@/lib/logger");
    expect(() => logger.error("Error occurred", "Something went wrong")).not.toThrow();
  });

  it("logger.error should handle metadata objects", async () => {
    const { logger } = await import("@/lib/logger");
    expect(() =>
      logger.error("Error occurred", { context: { userId: "usr_1" } })
    ).not.toThrow();
  });
});