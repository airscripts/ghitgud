import { describe, it, expect, vi, beforeEach } from "vitest";

import codeqlService from "@/services/codeql";
import codeqlOperations from "@/tui/operations/security-code";

vi.mock("@/services/codeql", () => ({
  default: { list: vi.fn(), view: vi.fn(), dismiss: vi.fn() },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(async () => "owner/repo") },
}));

describe("tui codeql operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs codeql.list", async () => {
    await codeqlOperations[0].run({
      values: { state: "open", severity: "high" },
    });
    expect(codeqlService.list).toHaveBeenCalledWith({
      repo: "owner/repo",
      state: "open",
      severity: "high",
    });
  });

  it("runs codeql.view", async () => {
    await codeqlOperations[1].run({ values: { alertNumber: 42 } });
    expect(codeqlService.view).toHaveBeenCalledWith({
      repo: "owner/repo",
      alertNumber: 42,
    });
  });

  it("runs codeql.dismiss", async () => {
    await codeqlOperations[2].run({
      values: { alertNumber: 42, reason: "false positive" },
    });
    expect(codeqlService.dismiss).toHaveBeenCalledWith({
      repo: "owner/repo",
      alertNumber: 42,
      reason: "false positive",
    });
  });
});
