import api from "@/api/protection";
import branchService from "@/services/branch";
import { describe, expect, it, vi, beforeEach, Mock } from "vitest";

vi.mock("@/api/protection", () => ({
  default: {
    protect: vi.fn(),
    unprotect: vi.fn(),
    listBranchProtection: vi.fn(),
    listTagProtection: vi.fn(),
    createTagProtection: vi.fn(),
    deleteTagProtection: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn(), renderSection: vi.fn() },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn().mockResolvedValue("owner/repo") },
}));

describe("branch service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("protects a branch", async () => {
    (api.protect as Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
    const result = await branchService.protect({
      repo: "owner/repo",
      branch: "main",
    });
    expect(result.success).toBe(true);
    expect(api.protect).toHaveBeenCalledWith(
      "owner/repo",
      "main",
      expect.any(Object),
    );
  });

  it("unprotects a branch", async () => {
    (api.unprotect as Mock).mockResolvedValue({ status: 204 });
    const result = await branchService.unprotect({
      repo: "owner/repo",
      branch: "main",
    });
    expect(result.success).toBe(true);
  });

  it("lists protection rules", async () => {
    (api.listBranchProtection as Mock).mockResolvedValue([
      { branch: "main", protected: true },
    ]);
    (api.listTagProtection as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve([{ id: 1, pattern: "v*", created_at: "2026-01-01" }]),
    });
    const result = await branchService.listProtection({ repo: "owner/repo" });
    expect(result.success).toBe(true);
  });

  it("creates tag protection", async () => {
    (api.createTagProtection as Mock).mockResolvedValue({
      json: () => Promise.resolve({ id: 1, pattern: "v*" }),
    });
    const result = await branchService.tagProtect({
      repo: "owner/repo",
      pattern: "v*",
    });
    expect(result.success).toBe(true);
  });

  it("deletes tag protection by pattern", async () => {
    (api.listTagProtection as Mock).mockResolvedValue({
      json: () => Promise.resolve([{ id: 1, pattern: "v*" }]),
    });
    (api.deleteTagProtection as Mock).mockResolvedValue({ status: 204 });
    const result = await branchService.tagUnprotect({
      repo: "owner/repo",
      pattern: "v*",
    });
    expect(result.success).toBe(true);
    expect(api.deleteTagProtection).toHaveBeenCalledWith("owner/repo", 1);
  });

  it("throws when tag protection pattern not found", async () => {
    (api.listTagProtection as Mock).mockResolvedValue({
      json: () => Promise.resolve([]),
    });
    await expect(
      branchService.tagUnprotect({
        repo: "owner/repo",
        pattern: "nonexistent",
      }),
    ).rejects.toThrow("not found");
  });
});
