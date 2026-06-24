import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import git from "@/core/git";
import repoResolver from "@/core/repo";
import { ERROR_NO_REPO } from "@/core/constants";

vi.mock("@/core/git", () => ({
  default: {
    getRemoteUrl: vi.fn(),
    parseRepoFromRemoteUrl: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    debug: vi.fn(),
  },
}));

const originalEnv = { ...process.env };

describe("repo resolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };

    vi.mocked(git.getRemoteUrl).mockImplementation(() => {
      throw new Error("no remote");
    });

    vi.mocked(git.parseRepoFromRemoteUrl).mockReturnValue(null);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("prefers explicit repo over git remote", async () => {
    vi.mocked(git.getRemoteUrl).mockReturnValue(
      "https://github.com/owner/git.git",
    );

    vi.mocked(git.parseRepoFromRemoteUrl).mockReturnValue("owner/git");

    await expect(repoResolver.resolveRepo("owner/explicit")).resolves.toBe(
      "owner/explicit",
    );
  });

  it("falls back to inferred git remote", async () => {
    vi.mocked(git.getRemoteUrl).mockReturnValue(
      "https://github.com/owner/git.git",
    );

    vi.mocked(git.parseRepoFromRemoteUrl).mockReturnValue("owner/git");

    await expect(repoResolver.resolveRepo()).resolves.toBe("owner/git");
  });

  it("throws when no repo source exists", async () => {
    await expect(repoResolver.resolveRepo()).rejects.toThrow(ERROR_NO_REPO);
  });

  it("normalizes github urls and git suffixes", async () => {
    await expect(
      repoResolver.resolveRepo("https://github.com/owner/repo.git"),
    ).resolves.toBe("owner/repo");
  });

  it("rejects invalid repo values", async () => {
    await expect(repoResolver.resolveRepo("owner")).rejects.toThrow(
      "Expected owner/repo format.",
    );
  });

  it("resolves comma-separated repo lists", async () => {
    await expect(
      repoResolver.resolveRepos("owner/one, https://github.com/owner/two.git"),
    ).resolves.toEqual(["owner/one", "owner/two"]);
  });
});
