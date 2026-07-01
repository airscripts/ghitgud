import reactions from "@/api/reactions";
import client from "@/providers/github/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/providers/github/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
    postTokenRequired: vi.fn(),
    deleteTokenRequired: vi.fn(),
  },
}));

describe("reactions api", () => {
  it("lists reactions for an issue", () => {
    reactions.listForIssue("owner/repo", 1);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/issues/1/reactions",
    );
  });

  it("creates a reaction for an issue", () => {
    reactions.createForIssue("owner/repo", 1, "+1");
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/issues/1/reactions",
      { content: "+1" },
    );
  });

  it("deletes a reaction for an issue", () => {
    reactions.deleteForIssue("owner/repo", 1, 42);
    expect(client.deleteTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/issues/1/reactions/42",
    );
  });

  it("lists reactions for a comment", () => {
    reactions.listForComment("owner/repo", 5);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/issues/comments/5/reactions",
    );
  });

  it("creates a reaction for a comment", () => {
    reactions.createForComment("owner/repo", 5, "heart");
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/issues/comments/5/reactions",
      { content: "heart" },
    );
  });

  it("deletes a reaction for a comment", () => {
    reactions.deleteForComment("owner/repo", 5, 99);
    expect(client.deleteTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/issues/comments/5/reactions/99",
    );
  });

  it("lists reactions for a review comment", () => {
    reactions.listForReviewComment("owner/repo", 10);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/pulls/comments/10/reactions",
    );
  });

  it("creates a reaction for a review comment", () => {
    reactions.createForReviewComment("owner/repo", 10, "rocket");
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/pulls/comments/10/reactions",
      { content: "rocket" },
    );
  });

  it("deletes a reaction for a review comment", () => {
    reactions.deleteForReviewComment("owner/repo", 10, 55);
    expect(client.deleteTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/pulls/comments/10/reactions/55",
    );
  });
});
