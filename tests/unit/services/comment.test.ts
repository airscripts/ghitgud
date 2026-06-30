import api from "@/api/comments";
import commentService from "@/services/comment";
import { describe, expect, it, vi, beforeEach, Mock } from "vitest";

vi.mock("@/api/comments", () => ({
  default: {
    list: vi.fn(),
    create: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
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

describe("comment service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists comments", async () => {
    (api.list as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve([
          {
            id: 1,
            body: "Hello",
            user: { login: "octocat" },
            created_at: "2026-01-01",
            updated_at: "2026-01-01",
          },
        ]),
    });
    const result = await commentService.list({ issue: 1 });
    expect(result.success).toBe(true);
    expect(api.list).toHaveBeenCalledWith("owner/repo", 1);
  });

  it("replies to an issue", async () => {
    (api.create as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          id: 2,
          body: "Reply",
          user: { login: "octocat" },
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
        }),
    });
    const result = await commentService.reply({ issue: 1, body: "Reply" });
    expect(result.success).toBe(true);
    expect(api.create).toHaveBeenCalledWith("owner/repo", 1, "Reply");
  });

  it("deletes a comment", async () => {
    (api.remove as Mock).mockResolvedValue({ status: 204 });
    const result = await commentService.remove({ commentId: 5 });
    expect(result.success).toBe(true);
    expect(api.remove).toHaveBeenCalledWith("owner/repo", 5);
  });

  it("rejects missing issue", async () => {
    await expect(commentService.list({})).rejects.toThrow(
      "--issue is required",
    );
  });

  it("rejects missing body", async () => {
    await expect(commentService.reply({ issue: 1, body: "" })).rejects.toThrow(
      "--body is required",
    );
  });
});
