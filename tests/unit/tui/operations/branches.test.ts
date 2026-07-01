import { describe, it, expect, vi, beforeEach } from "vitest";

import branchService from "@/services/branch";
import branchOperations from "@/tui/operations/policy-branches";

vi.mock("@/services/branch", () => ({
  default: {
    protect: vi.fn(),
    unprotect: vi.fn(),
    listProtection: vi.fn(),
    tagProtect: vi.fn(),
    tagUnprotect: vi.fn(),
  },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(async () => "owner/repo") },
}));

describe("tui branch operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs branch.protect", async () => {
    await branchOperations[0].run({
      values: { branch: "main", requiredReviews: 2, dismissStale: true },
    });
    expect(branchService.protect).toHaveBeenCalledWith({
      repo: "owner/repo",
      branch: "main",
      requiredReviews: 2,
      dismissStale: true,
    });
  });

  it("runs branch.unprotect", async () => {
    await branchOperations[1].run({ values: { branch: "main" } });
    expect(branchService.unprotect).toHaveBeenCalledWith({
      repo: "owner/repo",
      branch: "main",
    });
  });

  it("runs branch.protection.list", async () => {
    await branchOperations[2].run({ values: {} });
    expect(branchService.listProtection).toHaveBeenCalledWith({
      repo: "owner/repo",
    });
  });

  it("runs branch.tag-protect", async () => {
    await branchOperations[3].run({ values: { pattern: "v*" } });
    expect(branchService.tagProtect).toHaveBeenCalledWith({
      repo: "owner/repo",
      pattern: "v*",
    });
  });

  it("runs branch.tag-unprotect", async () => {
    await branchOperations[4].run({ values: { pattern: "v*" } });
    expect(branchService.tagUnprotect).toHaveBeenCalledWith({
      repo: "owner/repo",
      pattern: "v*",
    });
  });
});
