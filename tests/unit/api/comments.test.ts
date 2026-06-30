import comments from "@/api/comments";
import client from "@/api/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
    postTokenRequired: vi.fn(),
    patchTokenRequired: vi.fn(),
    deleteTokenRequired: vi.fn(),
  },
}));

describe("comments api", () => {
  it("lists comments for an issue", () => {
    comments.list("owner/repo", 1);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/issues/1/comments",
    );
  });

  it("creates a comment", () => {
    comments.create("owner/repo", 1, "Hello");
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/issues/1/comments",
      { body: "Hello" },
    );
  });

  it("gets a comment", () => {
    comments.get("owner/repo", 5);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/issues/comments/5",
    );
  });

  it("updates a comment", () => {
    comments.update("owner/repo", 5, "Updated");
    expect(client.patchTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/issues/comments/5",
      { body: "Updated" },
    );
  });

  it("deletes a comment", () => {
    comments.remove("owner/repo", 5);
    expect(client.deleteTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/issues/comments/5",
    );
  });
});
