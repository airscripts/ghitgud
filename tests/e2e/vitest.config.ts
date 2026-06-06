import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [],
    testTimeout: 30_000,
    include: ["tests/e2e/**/*.test.ts"],
  },
});
