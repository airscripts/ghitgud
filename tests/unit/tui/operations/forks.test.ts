import { describe, it, expect, vi, beforeEach } from "vitest";

import forkService from "@/services/fork";
import forkOperations from "@/tui/operations/forks";

vi.mock("@/services/fork", () => ({
  default: { sync: vi.fn(), compare: vi.fn(), list: vi.fn(), create: vi.fn() },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(async () => "owner/repo") },
}));

describe("tui fork operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs fork.sync", async () => {
    await forkOperations[0].run({ values: { branch: "main" } });
    expect(forkService.sync).toHaveBeenCalledWith({
      repo: "owner/repo",
      branch: "main",
    });
  });

  it("runs fork.compare", async () => {
    await forkOperations[1].run({
      values: { upstream: "upstream/repo", branch: "main" },
    });
    expect(forkService.compare).toHaveBeenCalledWith({
      repo: "owner/repo",
      upstream: "upstream/repo",
      branch: "main",
    });
  });

  it("runs fork.list", async () => {
    await forkOperations[2].run({ values: {} });
    expect(forkService.list).toHaveBeenCalledWith({ repo: "owner/repo" });
  });

  it("runs fork.create", async () => {
    await forkOperations[3].run({
      values: { repo: "upstream/repo", org: "my-org" },
    });
    expect(forkService.create).toHaveBeenCalledWith({
      repo: "upstream/repo",
      org: "my-org",
    });
  });
});
