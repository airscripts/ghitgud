import { describe, expect, it, vi } from "vitest";

vi.mock("child_process", () => ({
  execSync: vi.fn().mockReturnValue(""),
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn() },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

vi.mock("@/core/errors", () => ({
  GitfleetError: class extends Error {},
}));

import staleService from "@/services/stale";

describe("stale service", () => {
  it("finds no stale branches when none exist", () => {
    const result = staleService.stale({ days: 30 });
    expect(result.success).toBe(true);
    expect(result.branches).toHaveLength(0);
  });

  it("sweeps with no matching branches", () => {
    const result = staleService.sweep({ pattern: "feature/*", days: 30 });
    expect(result.success).toBe(true);
  });
});
