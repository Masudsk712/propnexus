// ============================================================================
// Vitest Configuration — Unit & Integration Testing
// ============================================================================

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Enable global test utilities (describe, it, expect)
    globals: true,
    // Test file patterns
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "tests/**/*.test.ts"],
    // Exclude integration tests from default run
    exclude: ["node_modules", "dist", ".next"],
    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      include: [
        "src/lib/stripe.ts",
        "src/lib/sentry.ts",
        "src/lib/logger.ts",
        "src/services/subscription.service.ts",
        "src/services/auth.service.ts",
      ],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
      ],
      // Target: 40% coverage for Phase 1 files
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 30,
        statements: 40,
      },
    },
    // Environment setup
    environment: "node",
    // Timeout for each test
    testTimeout: 10000,
    // Setup files
    setupFiles: ["./src/test-setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});