import { describe, it, expect, vi, beforeEach } from "vitest";

import api from "@/api/search";
import logger from "@/core/logger";
import searchService from "@/services/search";

vi.mock("@/api/search", () => ({
  default: {
    prs: vi.fn(),
    code: vi.fn(),
    repos: vi.fn(),
    issues: vi.fn(),
    commits: vi.fn(),
  },
}));

vi.mock("@/core/output", () => ({
  default: {
    renderTable: vi.fn(),
    renderSummary: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    start: vi.fn(),
    success: vi.fn(),
  },
}));

const mockIssueResult = {
  totalCount: 2,
  incompleteResults: false,
  items: [
    {
      id: 1,
      number: 42,
      score: 1.5,
      comments: 3,
      body: "Test",
      state: "open",
      isPullRequest: false,
      user: { login: "octocat" },
      assignees: [{ login: "dev" }],
      title: "Memory leak in parser",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
      labels: [{ name: "bug", color: "ff0000" }],
      htmlUrl: "https://github.com/owner/repo/issues/42",
      repositoryUrl: "https://api.github.com/repos/owner/repo",
    },

    {
      id: 2,
      user: null,
      number: 43,
      labels: [],
      score: 0.9,
      body: null,
      comments: 0,
      assignees: [],
      state: "closed",
      isPullRequest: true,
      title: "Another issue",
      createdAt: "2026-01-03T00:00:00Z",
      updatedAt: "2026-01-04T00:00:00Z",
      htmlUrl: "https://github.com/owner/repo/issues/43",
      repositoryUrl: "https://api.github.com/repos/owner/repo",
    },
  ],
};

const mockRepoResult = {
  totalCount: 1,
  incompleteResults: false,
  items: [
    {
      id: 10,
      score: 2.0,
      name: "repo",
      forksCount: 20,
      private: false,
      archived: false,
      stargazersCount: 100,
      fullName: "owner/repo",
      language: "TypeScript",
      description: "A test repo",
      updatedAt: "2026-01-03T00:00:00Z",
      htmlUrl: "https://github.com/owner/repo",
    },
  ],
};

const mockCodeResult = {
  totalCount: 1,
  incompleteResults: false,

  items: [
    {
      score: 3.0,
      name: "index.ts",
      path: "src/index.ts",
      repository: { fullName: "owner/repo" },
      htmlUrl: "https://github.com/owner/repo/blob/main/src/index.ts",
    },
  ],
};

const mockCommitResult = {
  totalCount: 1,
  incompleteResults: false,

  items: [
    {
      score: 4.0,
      message: "feat: add search",
      date: "2026-01-04T00:00:00Z",
      author: { login: "octocat" },
      sha: "abc123def456789012345678901234567890abcd",
      htmlUrl: "https://github.com/owner/repo/commit/abc123d",
    },
  ],
};

describe("search service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("searches issues and renders results", async () => {
    vi.mocked(api.issues).mockResolvedValue(mockIssueResult as never);

    const result = await searchService.searchIssues("memory leak", {
      repo: "owner/repo",
    });

    expect(result.totalCount).toBe(2);
    expect(result.items).toHaveLength(2);

    expect(api.issues).toHaveBeenCalledWith("memory leak", {
      repo: "owner/repo",
    });
  });

  it("searches prs and renders results", async () => {
    vi.mocked(api.prs).mockResolvedValue(mockIssueResult as never);

    const result = await searchService.searchPrs("fix typo");
    expect(result.totalCount).toBe(2);
    expect(api.prs).toHaveBeenCalledWith("fix typo", {});
  });

  it("searches repos and renders results", async () => {
    vi.mocked(api.repos).mockResolvedValue(mockRepoResult as never);

    const result = await searchService.searchRepos("typescript framework", {
      language: "typescript",
    });

    expect(result.totalCount).toBe(1);
    expect(api.repos).toHaveBeenCalledWith("typescript framework", {
      language: "typescript",
    });
  });

  it("searches code and renders results", async () => {
    vi.mocked(api.code).mockResolvedValue(mockCodeResult as never);

    const result = await searchService.searchCode("useEffect", {
      repo: "owner/repo",
    });

    expect(result.totalCount).toBe(1);
    expect(api.code).toHaveBeenCalledWith("useEffect", { repo: "owner/repo" });
  });

  it("searches commits and renders results", async () => {
    vi.mocked(api.commits).mockResolvedValue(mockCommitResult as never);

    const result = await searchService.searchCommits("feat", {
      repo: "owner/repo",
    });

    expect(result.totalCount).toBe(1);
    expect(api.commits).toHaveBeenCalledWith("feat", { repo: "owner/repo" });
  });

  it("logs start and success messages", async () => {
    vi.mocked(api.issues).mockResolvedValue(mockIssueResult as never);

    await searchService.searchIssues("test");
    expect(logger.start).toHaveBeenCalled();
    expect(logger.success).toHaveBeenCalled();
  });
});
