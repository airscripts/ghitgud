import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockRepo = "owner/repo";

vi.mock("@/providers/github/client", () => ({
  default: {
    get: vi.fn(),
    getTokenRequired: vi.fn(),
    putTokenRequired: vi.fn(),
    postTokenRequired: vi.fn(),
    patchTokenRequired: vi.fn(),
    deleteTokenRequired: vi.fn(),
    getTokenRequiredWithAccept: vi.fn(),
  },
}));

import client from "@/providers/github/client";
import pr from "@/api/pr";

describe("pr api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchMerged", () => {
    it("should fetch merged PRs", async () => {
      const mockResponse = { status: 200 } as Response;
      vi.mocked(client.get).mockResolvedValue(mockResponse);
      const result = await pr.fetchMerged("owner/repo");

      expect(client.get).toHaveBeenCalledWith(
        `/repos/${mockRepo}/pulls?state=closed&per_page=100`,
      );

      expect(result).toBe(mockResponse);
    });
  });

  describe("getCommit", () => {
    it("should fetch a commit by sha", async () => {
      const mockResponse = { status: 200 } as Response;
      vi.mocked(client.get).mockResolvedValue(mockResponse);
      const result = await pr.getCommit("abc123", "owner/repo");

      expect(client.get).toHaveBeenCalledWith(
        `/repos/${mockRepo}/commits/abc123`,
      );

      expect(result).toBe(mockResponse);
    });
  });

  describe("fetch", () => {
    it("should fetch a PR by number", async () => {
      const mockPr = {
        number: 123,
        state: "open",
        merged: false,
        title: "Test PR",
        merge_commit_sha: "abc123",
        maintainer_can_modify: true,
        head: {
          ref: "feature-branch",
          repo: {
            full_name: "owner/repo",
            html_url: "https://github.com/owner/repo",
          },
        },
        base: {
          ref: "main",
        },
      };

      vi.mocked(client.getTokenRequired).mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockPr),
      } as unknown as Response);

      const result = await pr.fetch(123, "owner/repo");
      expect(client.getTokenRequired).toHaveBeenCalledWith(
        `/repos/${mockRepo}/pulls/123`,
      );

      expect(result).toEqual(mockPr);
    });
  });

  describe("checkPushAccess", () => {
    it("should return true when user has push access", async () => {
      vi.mocked(client.get).mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          permissions: { push: true },
        }),
      } as unknown as Response);

      const result = await pr.checkPushAccess("owner/repo");
      expect(client.get).toHaveBeenCalledWith("/repos/owner/repo");
      expect(result).toBe(true);
    });

    it("should return false when user does not have push access", async () => {
      vi.mocked(client.get).mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          permissions: { push: false },
        }),
      } as unknown as Response);

      const result = await pr.checkPushAccess("owner/repo");
      expect(result).toBe(false);
    });

    it("should return false on API error", async () => {
      vi.mocked(client.get).mockRejectedValue(new Error("API Error"));
      const result = await pr.checkPushAccess("owner/repo");
      expect(result).toBe(false);
    });
  });

  describe("listOpen", () => {
    it("should fetch open PRs", async () => {
      const mockResponse = { status: 200 } as Response;
      vi.mocked(client.get).mockResolvedValue(mockResponse);

      const result = await pr.listOpen("owner/repo");
      expect(client.get).toHaveBeenCalledWith(
        `/repos/${mockRepo}/pulls?state=open&per_page=100`,
      );

      expect(result).toBe(mockResponse);
    });
  });

  describe("createPr", () => {
    it("should create a PR", async () => {
      const mockPr = {
        number: 124,
        state: "open",
        merged: false,
        title: "New PR",
        base: { ref: "main" },
        merge_commit_sha: null,
        maintainer_can_modify: true,
        head: { ref: "feature", repo: null },
      };

      const body = {
        base: "main",
        draft: false,
        title: "New PR",
        head: "feature",
        body: "PR description",
      };

      vi.mocked(client.postTokenRequired).mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockPr),
      } as unknown as Response);

      const result = await pr.createPr("owner/repo", body);
      expect(client.postTokenRequired).toHaveBeenCalledWith(
        `/repos/${mockRepo}/pulls`,
        body,
      );

      expect(result).toEqual(mockPr);
    });
  });

  describe("updatePr", () => {
    it("should update a PR", async () => {
      const mockPr = {
        number: 123,
        state: "open",
        merged: false,
        title: "Updated PR",
        base: { ref: "main" },
        merge_commit_sha: null,
        maintainer_can_modify: true,
        head: { ref: "feature", repo: null },
      };

      const body = {
        title: "Updated PR",
        body: "Updated description",
      };

      vi.mocked(client.patchTokenRequired).mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockPr),
      } as unknown as Response);

      const result = await pr.updatePr("owner/repo", 123, body);
      expect(client.patchTokenRequired).toHaveBeenCalledWith(
        `/repos/${mockRepo}/pulls/123`,
        body,
      );

      expect(result).toEqual(mockPr);
    });

    it("should support updating all fields", async () => {
      const body = {
        base: "develop",
        body: "New Body",
        title: "New Title",
        state: "closed" as const,
      };

      vi.mocked(client.patchTokenRequired).mockResolvedValue({
        json: vi.fn().mockResolvedValue({}),
      } as unknown as Response);

      await pr.updatePr("owner/repo", 123, body);
      expect(client.patchTokenRequired).toHaveBeenCalledWith(
        `/repos/${mockRepo}/pulls/123`,
        body,
      );
    });
  });

  it("lists pull requests with encoded filters", async () => {
    vi.mocked(client.getTokenRequired).mockResolvedValue({} as Response);
    await pr.list("owner/repo", {
      limit: 10,
      base: "main",
      state: "merged",
      head: "feature/x",
    });

    const endpoint = vi.mocked(client.getTokenRequired).mock.calls[0][0];
    const url = new URL(endpoint, "https://api.github.com");

    expect(url.pathname).toBe("/repos/owner/repo/pulls");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      base: "main",
      per_page: "10",
      state: "closed",
      sort: "updated",
      direction: "desc",
      head: "owner:feature/x",
    });
  });

  it("calls lifecycle endpoints", async () => {
    await pr.merge("owner/repo", 1, "squash");
    await pr.comment("owner/repo", 1, "Done");
    await pr.lock("owner/repo", 1);
    await pr.unlock("owner/repo", 1);
    await pr.ready("owner/repo", 1);
    await pr.deleteBranch("owner/repo", "feature/x");

    expect(client.putTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/pulls/1/merge",
      { merge_method: "squash" },
    );

    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/issues/1/comments",
      { body: "Done" },
    );

    expect(client.deleteTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/git/refs/heads/feature%2Fx",
    );
  });

  it("requests raw diffs and both check APIs", async () => {
    await pr.diff("owner/repo", 2);
    await pr.checkRuns("owner/repo", "abc");
    await pr.combinedStatus("owner/repo", "abc");

    expect(client.getTokenRequiredWithAccept).toHaveBeenCalledWith(
      "/repos/owner/repo/pulls/2",
      "application/vnd.github.diff",
    );

    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/commits/abc/check-runs?per_page=100",
    );
  });
});
