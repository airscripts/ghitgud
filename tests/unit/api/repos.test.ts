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
  const mockRepo = "owner/repo";

  beforeEach(() => {
    vi.clearAllMocks();
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

  describe("archive", () => {
    it("should archive a repo", async () => {
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
