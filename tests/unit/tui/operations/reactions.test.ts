import { describe, it, expect, vi, beforeEach } from "vitest";

import reactionService from "@/services/reaction";
import reactionOperations from "@/tui/operations/reactions";

vi.mock("@/services/reaction", () => ({
  default: { list: vi.fn(), add: vi.fn(), remove: vi.fn() },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(async () => "owner/repo") },
}));

describe("tui reaction operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs react.list with issue", async () => {
    await reactionOperations[0].run({
      values: { issue: 42, comment: 0, reviewComment: 0 },
    });
    expect(reactionService.list).toHaveBeenCalledWith({
      repo: "owner/repo",
      issue: 42,
      comment: undefined,
      reviewComment: undefined,
    });
  });

  it("runs react.add", async () => {
    await reactionOperations[1].run({
      values: { issue: 42, comment: 0, reviewComment: 0, emoji: "+1" },
    });
    expect(reactionService.add).toHaveBeenCalledWith({
      repo: "owner/repo",
      issue: 42,
      comment: undefined,
      reviewComment: undefined,
      emoji: "+1",
    });
  });

  it("runs react.remove", async () => {
    await reactionOperations[2].run({
      values: { reactionId: 99, issue: 0, comment: 0, reviewComment: 0 },
    });
    expect(reactionService.remove).toHaveBeenCalledWith({
      repo: "owner/repo",
      reactionId: 99,
      issue: undefined,
      comment: undefined,
      reviewComment: undefined,
    });
  });
});
