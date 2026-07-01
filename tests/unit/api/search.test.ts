import { describe, it, expect, vi, beforeEach } from "vitest";

import search from "@/api/search";
import client from "@/api/client";

vi.mock("@/api/client", () => ({
  default: {
    getSearchPaginated: vi.fn(),
  },
}));

describe("search api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("searches issues with query and qualifiers", async () => {
    vi.mocked(client.getSearchPaginated).mockResolvedValue({
      totalCount: 1,
      incompleteResults: false,
      items: [expect.objectContaining({ number: 42 })],
    });

    await search.issues("memory leak", { repo: "owner/repo", state: "open" });
    expect(client.getSearchPaginated).toHaveBeenCalledTimes(1);
    const endpoint = vi.mocked(client.getSearchPaginated).mock.calls[0][0];
    expect(endpoint).toContain("/search/issues?");
    expect(endpoint).toContain("q=");
    expect(endpoint).toContain("repo%3Aowner%2Frepo");
    expect(endpoint).toContain("state%3Aopen");
  });

  it("searches prs with is:pr qualifier", async () => {
    vi.mocked(client.getSearchPaginated).mockResolvedValue({
      totalCount: 1,
      incompleteResults: false,
      items: [expect.objectContaining({ number: 42 })],
    });

    await search.prs("fix typo");
    expect(client.getSearchPaginated).toHaveBeenCalledTimes(1);
    const endpoint = vi.mocked(client.getSearchPaginated).mock.calls[0][0];
    expect(endpoint).toContain("is%3Apr");
  });

  it("searches prs with merged state", async () => {
    vi.mocked(client.getSearchPaginated).mockResolvedValue({
      items: [],
      totalCount: 0,
      incompleteResults: false,
    });

    await search.prs("fix", { state: "merged" });
    const endpoint = vi.mocked(client.getSearchPaginated).mock.calls[0][0];
    expect(endpoint).toContain("is%3Amerged");
  });

  it("searches repositories", async () => {
    vi.mocked(client.getSearchPaginated).mockResolvedValue({
      totalCount: 1,
      incompleteResults: false,
      items: [expect.objectContaining({ fullName: "owner/repo" })],
    });

    await search.repos("typescript framework", { language: "typescript" });
    const endpoint = vi.mocked(client.getSearchPaginated).mock.calls[0][0];
    expect(endpoint).toContain("/search/repositories?");
    expect(endpoint).toContain("language%3Atypescript");
  });

  it("searches code with repo scope", async () => {
    vi.mocked(client.getSearchPaginated).mockResolvedValue({
      totalCount: 1,
      incompleteResults: false,
      items: [expect.objectContaining({ name: "index.ts" })],
    });

    await search.code("useEffect", { repo: "owner/repo" });
    const endpoint = vi.mocked(client.getSearchPaginated).mock.calls[0][0];
    expect(endpoint).toContain("/search/code?");
    expect(endpoint).toContain("repo%3Aowner%2Frepo");
  });

  it("searches commits with author filter", async () => {
    vi.mocked(client.getSearchPaginated).mockResolvedValue({
      totalCount: 1,
      incompleteResults: false,
      items: [expect.objectContaining({ sha: "abc123d" })],
    });

    await search.commits("feat", { repo: "owner/repo", author: "octocat" });
    const endpoint = vi.mocked(client.getSearchPaginated).mock.calls[0][0];
    expect(endpoint).toContain("/search/commits?");
    expect(endpoint).toContain("repo%3Aowner%2Frepo");
    expect(endpoint).toContain("author%3Aoctocat");
  });

  it("passes sort and order options", async () => {
    vi.mocked(client.getSearchPaginated).mockResolvedValue({
      items: [],
      totalCount: 0,
      incompleteResults: false,
    });

    await search.issues("bug", { sort: "comments", order: "asc", limit: 10 });
    const endpoint = vi.mocked(client.getSearchPaginated).mock.calls[0][0];
    expect(endpoint).toContain("sort=comments");
    expect(endpoint).toContain("order=asc");
    expect(endpoint).toContain("per_page=10");
  });

  it("searches issues with state=all (no qualifier added)", async () => {
    vi.mocked(client.getSearchPaginated).mockResolvedValue({
      items: [],
      totalCount: 0,
      incompleteResults: false,
    });

    await search.issues("bug", { state: "all" });
    const endpoint = vi.mocked(client.getSearchPaginated).mock.calls[0][0];
    expect(endpoint).not.toContain("state");
  });

  it("searches issues with language and author", async () => {
    vi.mocked(client.getSearchPaginated).mockResolvedValue({
      items: [],
      totalCount: 0,
      incompleteResults: false,
    });

    await search.issues("bug", { language: "typescript", author: "octocat" });
    const endpoint = vi.mocked(client.getSearchPaginated).mock.calls[0][0];
    expect(endpoint).toContain("language%3Atypescript");
    expect(endpoint).toContain("author%3Aoctocat");
  });

  it("searches prs with non-merged state", async () => {
    vi.mocked(client.getSearchPaginated).mockResolvedValue({
      items: [],
      totalCount: 0,
      incompleteResults: false,
    });

    await search.prs("fix", { state: "open" });
    const endpoint = vi.mocked(client.getSearchPaginated).mock.calls[0][0];
    expect(endpoint).toContain("state%3Aopen");
    expect(endpoint).not.toContain("is%3Amerged");
  });

  it("searches repos without language", async () => {
    vi.mocked(client.getSearchPaginated).mockResolvedValue({
      items: [],
      totalCount: 0,
      incompleteResults: false,
    });

    await search.repos("framework");
    const endpoint = vi.mocked(client.getSearchPaginated).mock.calls[0][0];
    expect(endpoint).not.toContain("language");
  });

  it("searches code with language", async () => {
    vi.mocked(client.getSearchPaginated).mockResolvedValue({
      items: [],
      totalCount: 0,
      incompleteResults: false,
    });

    await search.code("TODO", { language: "python" });
    const endpoint = vi.mocked(client.getSearchPaginated).mock.calls[0][0];
    expect(endpoint).toContain("language%3Apython");
  });

  it("searches commits with sort and order", async () => {
    vi.mocked(client.getSearchPaginated).mockResolvedValue({
      items: [],
      totalCount: 0,
      incompleteResults: false,
    });

    await search.commits("fix", { sort: "author-date", order: "asc" });
    const endpoint = vi.mocked(client.getSearchPaginated).mock.calls[0][0];
    expect(endpoint).toContain("sort=author-date");
    expect(endpoint).toContain("order=asc");
  });

  it("uses default order when not specified for issues", async () => {
    vi.mocked(client.getSearchPaginated).mockResolvedValue({
      items: [],
      totalCount: 0,
      incompleteResults: false,
    });

    await search.issues("bug");
    const endpoint = vi.mocked(client.getSearchPaginated).mock.calls[0][0];
    expect(endpoint).toContain("order=desc");
  });
});
