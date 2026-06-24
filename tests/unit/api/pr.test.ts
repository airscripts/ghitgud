import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockRepo = "owner/repo";

vi.mock("@/api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import client from "@/api/client";
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

      vi.mocked(client.get).mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockPr),
      } as unknown as Response);

      const result = await pr.fetch(123, "owner/repo");
      expect(client.get).toHaveBeenCalledWith(`/repos/${mockRepo}/pulls/123`);

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

      vi.mocked(client.post).mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockPr),
      } as unknown as Response);

      const result = await pr.createPr("owner/repo", body);
      expect(client.post).toHaveBeenCalledWith(
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

      vi.mocked(client.patch).mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockPr),
      } as unknown as Response);

      const result = await pr.updatePr("owner/repo", 123, body);
      expect(client.patch).toHaveBeenCalledWith(
        `/repos/${mockRepo}/pulls/123`,
        body,
      );

      expect(result).toEqual(mockPr);
    });

    it("should support updating all fields", async () => {
      const body = {
        title: "New Title",
        body: "New Body",
        base: "develop",
        state: "closed",
      };

      vi.mocked(client.patch).mockResolvedValue({
        json: vi.fn().mockResolvedValue({}),
      } as unknown as Response);

      await pr.updatePr("owner/repo", 123, body);
      expect(client.patch).toHaveBeenCalledWith(
        `/repos/${mockRepo}/pulls/123`,
        body,
      );
    });
  });
});
