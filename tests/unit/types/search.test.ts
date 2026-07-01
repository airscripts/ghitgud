import { describe, it, expect } from "vitest";

import {
  normalizeIssueSearchItem,
  normalizeRepoSearchItem,
  normalizeCodeSearchItem,
  normalizeCommitSearchItem,
} from "@/types/search";

import type {
  SearchResult,
  SearchOptions,
  IssueSearchItem,
} from "@/types/search";

describe("search types", () => {
  it("has SearchResult type", () => {
    const result: SearchResult<IssueSearchItem> = {
      items: [],
      totalCount: 0,
      incompleteResults: false,
    };

    expect(result.totalCount).toBe(0);
  });

  it("has SearchOptions type", () => {
    const opts: SearchOptions = { repo: "org/repo", limit: 10 };
    expect(opts.limit).toBe(10);
  });

  it("normalizes issue search items", () => {
    const result = normalizeIssueSearchItem({
      id: 1,
      title: "Bug",
      state: "open",
      number: 42,
      html_url: "https://github.com/org/repo/issues/42",
      repository_url: "https://api.github.com/repos/org/repo",
      user: { login: "octocat" },
      labels: [{ name: "bug", color: "ff0000" }],
      score: 0.99,
      body: "desc",
      created_at: "2026-01-01",
      updated_at: "2026-01-02",
      comments: 5,
      assignees: [{ login: "dev" }],
    });

    expect(result.id).toBe(1);
    expect(result.title).toBe("Bug");
    expect(result.isPullRequest).toBe(false);
    expect(result.repositoryUrl).toBe("https://api.github.com/repos/org/repo");
    expect(result.user?.login).toBe("octocat");
    expect(result.labels[0].name).toBe("bug");
    expect(result.assignees[0].login).toBe("dev");
  });

  it("detects pull request in issue search", () => {
    const result = normalizeIssueSearchItem({
      id: 2,
      title: "PR",
      state: "open",
      pull_request: {},
    });

    expect(result.isPullRequest).toBe(true);
  });

  it("handles missing fields in issue search", () => {
    const result = normalizeIssueSearchItem({ id: 3, title: "X" });

    expect(result.body).toBeNull();
    expect(result.comments).toBe(0);
    expect(result.labels).toEqual([]);
    expect(result.assignees).toEqual([]);
    expect(result.user).toBeNull();
  });

  it("normalizes repo search items", () => {
    const result = normalizeRepoSearchItem({
      id: 10,
      name: "repo",
      full_name: "org/repo",
      score: 0.5,
      html_url: "https://github.com/org/repo",
      private: false,
      archived: false,
      updated_at: "2026-01-01",
      forks_count: 5,
      language: "TypeScript",
      stargazers_count: 100,
      description: "A repo",
    });

    expect(result.id).toBe(10);
    expect(result.fullName).toBe("org/repo");
    expect(result.language).toBe("TypeScript");
    expect(result.stargazersCount).toBe(100);
    expect(result.forksCount).toBe(5);
  });

  it("handles missing optional repo fields", () => {
    const result = normalizeRepoSearchItem({
      id: 11,
      name: "repo",
      full_name: "org/repo",
      score: 0.5,
      html_url: "https://github.com/org/repo",
    });

    expect(result.language).toBeNull();
    expect(result.description).toBeNull();
    expect(result.forksCount).toBe(0);
    expect(result.archived).toBe(false);
  });

  it("normalizes code search items", () => {
    const result = normalizeCodeSearchItem({
      name: "index.ts",
      path: "src/index.ts",
      score: 0.8,
      html_url: "https://github.com/org/repo/blob/main/src/index.ts",
      repository: { full_name: "org/repo" },
    });

    expect(result.name).toBe("index.ts");
    expect(result.repository.fullName).toBe("org/repo");
  });

  it("normalizes commit search items", () => {
    const result = normalizeCommitSearchItem({
      sha: "abc123",
      score: 0.9,
      html_url: "https://github.com/org/repo/commit/abc123",
      commit: {
        message: "fix: bug",
        author: { login: "octocat", date: "2026-01-01" },
      },
    });

    expect(result.sha).toBe("abc123");
    expect(result.message).toBe("fix: bug");
    expect(result.author?.login).toBe("octocat");
    expect(result.date).toBe("2026-01-01");
  });

  it("handles missing commit author", () => {
    const result = normalizeCommitSearchItem({
      sha: "def456",
      score: 0.7,
      html_url: "https://github.com/org/repo/commit/def456",
      commit: { message: "chore: lint" },
    });

    expect(result.author).toBeNull();
    expect(result.date).toBe("");
  });
});
