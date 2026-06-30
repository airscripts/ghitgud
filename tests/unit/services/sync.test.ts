import { describe, expect, it, vi } from "vitest";
import syncService from "@/services/sync";

vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    readdirSync: vi.fn().mockReturnValue([]),
  },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn() },
}));

vi.mock("@/core/errors", () => ({
  GhitgudError: class extends Error {},
}));

describe("sync service", () => {
  it("handles no git repos", () => {
    const result = syncService.syncall({ root: "/tmp/test" });
    expect(result.success).toBe(true);
  });

  it("handles no git repos for status", () => {
    const result = syncService.statusall({ root: "/tmp/test" });
    expect(result.success).toBe(true);
  });
});
