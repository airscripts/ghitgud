import { describe, it, expect, vi, beforeEach } from "vitest";

import depsService from "@/services/deps";
import depsOperations from "@/tui/operations/dependencies";

vi.mock("@/services/deps", () => ({
  default: { list: vi.fn(), direct: vi.fn(), review: vi.fn() },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(async () => "owner/repo") },
}));

describe("tui dependencies operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs deps.list", async () => {
    await depsOperations[0].run({ values: {} });
    expect(depsService.list).toHaveBeenCalledWith({ repo: "owner/repo" });
  });

  it("runs deps.direct", async () => {
    await depsOperations[1].run({ values: {} });
    expect(depsService.direct).toHaveBeenCalledWith({ repo: "owner/repo" });
  });

  it("runs deps.review", async () => {
    await depsOperations[2].run({
      values: { base: "main", head: "feature" },
    });
    expect(depsService.review).toHaveBeenCalledWith({
      repo: "owner/repo",
      base: "main",
      head: "feature",
    });
  });
});
