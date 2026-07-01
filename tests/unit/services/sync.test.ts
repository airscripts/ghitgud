import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("child_process", () => ({
  execSync: vi.fn().mockReturnValue(""),
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
  GitfleetError: class extends Error {},
}));

import fs from "fs";
import syncService from "@/services/sync";

describe("sync service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([]);
  });

  it("handles no git repos", () => {
    vi.mocked(fs.readdirSync).mockReturnValue([]);
    const result = syncService.syncall({ root: "/tmp/test" });
    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(0);
  });

  it("handles no git repos for status", () => {
    vi.mocked(fs.readdirSync).mockReturnValue([]);
    const result = syncService.statusall({ root: "/tmp/test" });
    expect(result.success).toBe(true);
  });

  it("throws when directory not found for syncall", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(() => syncService.syncall({ root: "/nonexistent" })).toThrow(
      "Directory not found",
    );
  });

  it("throws when directory not found for statusall", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(() => syncService.statusall({ root: "/nonexistent" })).toThrow(
      "Directory not found",
    );
  });
});
