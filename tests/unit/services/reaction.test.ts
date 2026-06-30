import api from "@/api/reactions";
import reactionService from "@/services/reaction";
import { describe, expect, it, vi, beforeEach, Mock } from "vitest";

vi.mock("@/api/reactions", () => ({
  VALID_EMOJIS: [
    "+1",
    "-1",
    "laugh",
    "confused",
    "heart",
    "hooray",
    "rocket",
    "eyes",
  ],
  default: {
    listForIssue: vi.fn(),
    createForIssue: vi.fn(),
    deleteForIssue: vi.fn(),
    listForComment: vi.fn(),
    createForComment: vi.fn(),
    deleteForComment: vi.fn(),
    listForReviewComment: vi.fn(),
    createForReviewComment: vi.fn(),
    deleteForReviewComment: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn() },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn().mockResolvedValue("owner/repo") },
}));

describe("reaction service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists reactions for an issue", async () => {
    (api.listForIssue as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve([
          {
            id: 1,
            content: "+1",
            user: { login: "octocat" },
            created_at: "2026-01-01",
          },
        ]),
    });
    const result = await reactionService.list({ issue: 1 });
    expect(result.success).toBe(true);
    expect(api.listForIssue).toHaveBeenCalledWith("owner/repo", 1);
  });

  it("adds a reaction to an issue", async () => {
    (api.createForIssue as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          id: 2,
          content: "heart",
          user: { login: "octocat" },
          created_at: "2026-01-01",
        }),
    });
    const result = await reactionService.add({ issue: 1, emoji: "heart" });
    expect(result.success).toBe(true);
    expect(api.createForIssue).toHaveBeenCalledWith("owner/repo", 1, "heart");
  });

  it("rejects invalid emoji", async () => {
    await expect(
      reactionService.add({ issue: 1, emoji: "invalid" }),
    ).rejects.toThrow("Invalid emoji");
  });

  it("removes a reaction", async () => {
    (api.deleteForIssue as Mock).mockResolvedValue({ status: 204 });
    const result = await reactionService.remove({ issue: 1, reactionId: 2 });
    expect(result.success).toBe(true);
    expect(api.deleteForIssue).toHaveBeenCalledWith("owner/repo", 1, 2);
  });

  it("lists reactions for a comment", async () => {
    (api.listForComment as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve([
          {
            id: 3,
            content: "laugh",
            user: { login: "mona" },
            created_at: "2026-01-01",
          },
        ]),
    });
    const result = await reactionService.list({ comment: 5 });
    expect(result.success).toBe(true);
    expect(api.listForComment).toHaveBeenCalledWith("owner/repo", 5);
  });

  it("throws without a target", async () => {
    await expect(reactionService.list({})).rejects.toThrow("Provide");
  });
});
