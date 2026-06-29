import { beforeEach, describe, expect, it, vi } from "vitest";

import git from "@/core/git";
import reposApi from "@/api/repos";
import repositoryService from "@/services/repository";

vi.mock("@/api/repos", () => ({
  default: {
    get: vi.fn(),
    star: vi.fn(),
    fork: vi.fn(),
    unstar: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    fetchOrg: vi.fn(),
    fetchUser: vi.fn(),
    fetchUserRepos: vi.fn(),
  },
}));

vi.mock("@/core/git", () => ({
  default: {
    syncBranch: vi.fn(),
    getRemoteUrl: vi.fn(),
    cloneRepository: vi.fn(),
    parseRepoFromRemoteUrl: vi.fn(),
  },
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn(), renderKeyValues: vi.fn() },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

const apiRepo = {
  id: 1,
  name: "repo",
  fork: false,
  private: false,
  archived: false,
  pushed_at: null,
  default_branch: "main",
  full_name: "owner/repo",
  clone_url: "https://github.com/owner/repo.git",
};

describe("repository service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(reposApi.get).mockResolvedValue(apiRepo);
    vi.mocked(reposApi.create).mockResolvedValue(apiRepo);
    vi.mocked(reposApi.update).mockResolvedValue(apiRepo);
    vi.mocked(reposApi.fork).mockResolvedValue(apiRepo);
  });

  it("creates repositories and validates ownership", async () => {
    await repositoryService.create({ name: "repo", visibility: "public" });
    expect(reposApi.create).toHaveBeenCalled();

    await expect(
      repositoryService.create({
        name: "repo",
        ownerType: "org",
        visibility: "internal",
      }),
    ).rejects.toThrow("--owner");

    await expect(
      repositoryService.create({ name: "repo", visibility: "internal" }),
    ).rejects.toThrow("organization");
  });

  it("lists and filters repositories", async () => {
    vi.mocked(reposApi.fetchUserRepos).mockResolvedValue([
      {
        id: 1,
        fork: false,
        name: "public",
        private: false,
        pushedAt: null,
        archived: false,
        defaultBranch: "main",
        fullName: "owner/public",
      },

      {
        id: 2,
        fork: false,
        private: true,
        pushedAt: null,
        archived: false,
        name: "private",
        defaultBranch: "main",
        fullName: "owner/private",
      },
    ]);

    const result = await repositoryService.list({ type: "private" });
    expect(result.repositories).toHaveLength(1);
    expect(result.repositories[0].private).toBe(true);
  });

  it("views, clones, updates, stars, unstars, and deletes", async () => {
    await repositoryService.view("owner/repo");
    await repositoryService.clone("owner/repo", 1);
    await repositoryService.update("owner/repo", { archived: true });
    await repositoryService.star("owner/repo");
    await repositoryService.unstar("owner/repo");
    await repositoryService.remove("owner/repo");

    expect(git.cloneRepository).toHaveBeenCalledWith(apiRepo.clone_url, {
      depth: 1,
    });

    expect(reposApi.star).toHaveBeenCalledWith("owner/repo");
    expect(reposApi.unstar).toHaveBeenCalledWith("owner/repo");
    expect(reposApi.delete).toHaveBeenCalledWith("owner/repo");
  });

  it("rejects invalid clone depth and empty updates", async () => {
    await expect(repositoryService.clone("owner/repo", 0)).rejects.toThrow(
      "positive integer",
    );

    await expect(repositoryService.update("owner/repo", {})).rejects.toThrow(
      "At least one",
    );
  });

  it("forks and optionally clones", async () => {
    await repositoryService.fork("upstream/repo", {
      clone: true,
      remoteName: "fork",
    });

    expect(git.cloneRepository).toHaveBeenCalledWith(apiRepo.clone_url, {
      remoteName: "fork",
    });
  });

  it("syncs only the matching checkout", async () => {
    vi.mocked(git.getRemoteUrl).mockReturnValue(
      "https://github.com/owner/repo.git",
    );

    vi.mocked(git.parseRepoFromRemoteUrl).mockReturnValue("owner/repo");
    vi.mocked(git.syncBranch).mockReturnValue("main");
    const result = await repositoryService.sync("owner/repo");
    expect(result.branch).toBe("main");

    await expect(repositoryService.sync("other/repo")).rejects.toThrow(
      "Current checkout",
    );
  });
});
