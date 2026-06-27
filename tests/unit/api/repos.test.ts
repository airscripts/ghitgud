import repos from "@/api/repos";
import client from "@/api/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/api/client", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    getPaginated: vi.fn(),
    getRepo: vi.fn().mockReturnValue("owner/repo"),
    getDefaultPerPage: vi.fn().mockReturnValue(100),
  },
}));

describe("repos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(client.getDefaultPerPage).mockReturnValue(100);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchOrg", () => {
    it("should fetch org repos", async () => {
      const mockRepos = [
        {
          id: 1,
          fork: false,
          name: "repo1",
          private: false,
          archived: false,
          full_name: "org/repo1",
          default_branch: "main",
          pushed_at: "2024-01-01",
        },
        {
          id: 2,
          fork: true,
          name: "repo2",
          private: true,
          archived: false,
          pushed_at: null,
          full_name: "org/repo2",
          default_branch: "develop",
        },
      ];

      vi.mocked(client.getPaginated).mockResolvedValue(mockRepos);
      const result = await repos.fetchOrg("org");

      expect(client.getPaginated).toHaveBeenCalledWith(
        `/orgs/org/repos?per_page=100&type=all`,
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 1,
        name: "repo1",
        fullName: "org/repo1",
        defaultBranch: "main",
      });

      expect(result[1]).toMatchObject({
        id: 2,
        fork: true,
        private: true,
      });
    });
  });

  describe("fetchUser", () => {
    it("should fetch user repos", async () => {
      const mockRepos = [
        {
          id: 10,
          fork: false,
          private: false,
          archived: false,
          name: "myproject",
          default_branch: "main",
          pushed_at: "2024-06-01",
          full_name: "octocat/myproject",
        },

        {
          id: 11,
          fork: true,
          private: true,
          archived: false,
          name: "forked-repo",
          default_branch: "main",
          pushed_at: "2024-03-01",
          full_name: "octocat/forked-repo",
        },
      ];

      vi.mocked(client.getPaginated).mockResolvedValue(mockRepos);
      const result = await repos.fetchUser("octocat");

      expect(client.getPaginated).toHaveBeenCalledWith(
        `/users/octocat/repos?per_page=100&type=all`,
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 10,
        name: "myproject",
        defaultBranch: "main",
        fullName: "octocat/myproject",
      });

      expect(result[1]).toMatchObject({
        id: 11,
        fork: true,
        private: true,
      });
    });
  });

  describe("archive", () => {
    it("should archive a repo", async () => {
      const mockRepo = "owner/repo";
      const mockResponse = { status: 200 } as Response;
      vi.mocked(client.patch).mockResolvedValue(mockResponse);

      const result = await repos.archive(mockRepo);
      expect(client.patch).toHaveBeenCalledWith(`/repos/${mockRepo}`, {
        archived: true,
      });

      expect(result).toBe(mockResponse);
    });
  });
});
