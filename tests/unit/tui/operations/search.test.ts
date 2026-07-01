import { describe, it, expect, vi, beforeEach } from "vitest";

import searchService from "@/services/search";
import searchOperations from "@/tui/operations/search";

vi.mock("@/services/search", () => ({
  default: {
    searchIssues: vi.fn(),
    searchPrs: vi.fn(),
    searchRepos: vi.fn(),
    searchCode: vi.fn(),
    searchCommits: vi.fn(),
  },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(async () => "owner/repo") },
}));

describe("tui search operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs search.issues", async () => {
    await searchOperations[0].run({
      values: { query: "bug", state: "open", limit: 10 },
    });
    expect(searchService.searchIssues).toHaveBeenCalledWith("bug", {
      repo: "owner/repo",
      state: "open",
      limit: 10,
    });
  });

  it("runs search.prs", async () => {
    await searchOperations[1].run({
      values: { query: "feature", limit: 10 },
    });
    expect(searchService.searchPrs).toHaveBeenCalledWith("feature", {
      repo: "owner/repo",
      limit: 10,
    });
  });

  it("runs search.repos", async () => {
    await searchOperations[2].run({
      values: { query: "typescript", language: "ts", limit: 30 },
    });
    expect(searchService.searchRepos).toHaveBeenCalledWith("typescript", {
      language: "ts",
      limit: 30,
    });
  });

  it("runs search.code", async () => {
    await searchOperations[3].run({
      values: { query: "TODO", limit: 30 },
    });
    expect(searchService.searchCode).toHaveBeenCalledWith("TODO", {
      repo: "owner/repo",
      limit: 30,
    });
  });

  it("runs search.commits", async () => {
    await searchOperations[4].run({
      values: { query: "fix", author: "octocat", limit: 30 },
    });
    expect(searchService.searchCommits).toHaveBeenCalledWith("fix", {
      repo: "owner/repo",
      author: "octocat",
      limit: 30,
    });
  });
});
