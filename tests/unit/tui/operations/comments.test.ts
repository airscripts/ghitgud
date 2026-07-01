import { describe, it, expect, vi, beforeEach } from "vitest";

import commentService from "@/services/comment";
import commentOperations from "@/tui/operations/comments";

vi.mock("@/services/comment", () => ({
  default: { list: vi.fn(), reply: vi.fn(), remove: vi.fn() },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(async () => "owner/repo") },
}));

describe("tui comment operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs comment.list", async () => {
    await commentOperations[0].run({ values: { issue: 42 } });
    expect(commentService.list).toHaveBeenCalledWith({
      repo: "owner/repo",
      issue: 42,
    });
  });

  it("runs comment.reply", async () => {
    await commentOperations[1].run({
      values: { issue: 42, body: "hello" },
    });
    expect(commentService.reply).toHaveBeenCalledWith({
      repo: "owner/repo",
      issue: 42,
      body: "hello",
    });
  });

  it("runs comment.delete", async () => {
    await commentOperations[2].run({ values: { commentId: 99 } });
    expect(commentService.remove).toHaveBeenCalledWith({
      repo: "owner/repo",
      commentId: 99,
    });
  });
});
