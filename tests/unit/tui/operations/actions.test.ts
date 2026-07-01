import { describe, it, expect, vi, beforeEach } from "vitest";

import costService from "@/services/cost";
import actionsOperations from "@/tui/operations/analytics-pipeline";

vi.mock("@/services/cost", () => ({
  default: {
    usage: vi.fn(),
    cost: vi.fn(),
    topSpenders: vi.fn(),
  },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(async () => "owner/repo") },
}));

describe("tui actions operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs actions.usage", async () => {
    await actionsOperations[0].run({ values: { repo: "owner/repo" } });
    expect(costService.usage).toHaveBeenCalledWith({ repo: "owner/repo" });
  });

  it("runs actions.cost", async () => {
    await actionsOperations[1].run({
      values: { repo: "owner/repo", org: "my-org" },
    });
    expect(costService.cost).toHaveBeenCalledWith({
      org: "my-org",
      repo: "owner/repo",
    });
  });

  it("runs actions.top-spenders", async () => {
    await actionsOperations[2].run({
      values: { repo: "owner/repo", limit: 5 },
    });
    expect(costService.topSpenders).toHaveBeenCalledWith({
      repo: "owner/repo",
      limit: 5,
    });
  });
});
