import { describe, it, expect, vi, beforeEach } from "vitest";

import client from "@/api/client";
import issues from "@/api/issues";
import { jsonResponse } from "../helpers/response";

vi.mock("@/api/client", () => ({
  default: {
    get: vi.fn(),
    getTokenRequired: vi.fn(),
    putTokenRequired: vi.fn(),
    postTokenRequired: vi.fn(),
    patchTokenRequired: vi.fn(),
    deleteTokenRequired: vi.fn(),
    graphqlTokenRequired: vi.fn(),
  },
}));

describe("issues api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches an issue from the configured repo", async () => {
    vi.mocked(client.getTokenRequired).mockResolvedValue({
      status: 200,
    } as Response);

    await issues.get(42, "owner/repo");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/issues/42",
    );
  });

  it("creates issues with optional body", async () => {
    vi.mocked(client.postTokenRequired).mockResolvedValue({
      status: 201,
    } as Response);

    await issues.create({ title: "Bug", body: "Details" }, "owner/other");
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/other/issues",
      { title: "Bug", body: "Details" },
    );
  });

  it("lists and adds sub-issues", async () => {
    vi.mocked(client.getTokenRequired).mockResolvedValue({
      status: 200,
    } as Response);

    vi.mocked(client.postTokenRequired).mockResolvedValue({
      status: 201,
    } as Response);

    await issues.listSubIssues(1, "owner/repo");
    await issues.addSubIssue(1, 99, "owner/repo");

    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/issues/1/sub_issues",
    );

    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/issues/1/sub_issues",
      { sub_issue_id: 99 },
    );
  });

  it("counts open and stale issues using encoded search queries", async () => {
    vi.mocked(client.get).mockResolvedValueOnce(
      jsonResponse({ total_count: 7 }),
    );

    vi.mocked(client.get).mockResolvedValueOnce(
      jsonResponse({ total_count: 7 }),
    );

    await expect(issues.countOpen("owner/repo")).resolves.toBe(7);
    await expect(issues.countStale("owner/repo", "2026-01-01")).resolves.toBe(
      7,
    );

    expect(client.get).toHaveBeenCalledWith(
      "/search/issues?q=repo%3Aowner%2Frepo%20type%3Aissue%20state%3Aopen&per_page=1",
    );

    expect(client.get).toHaveBeenCalledWith(
      "/search/issues?q=repo%3Aowner%2Frepo%20type%3Aissue%20state%3Aopen%20updated%3A%3C2026-01-01&per_page=1",
    );
  });

  it("searches issues with filters and omits state for all", async () => {
    vi.mocked(client.getTokenRequired).mockResolvedValue({} as Response);

    await issues.list("owner/repo", {
      state: "all",
      labels: ["help wanted"],
      assignees: ["octocat"],
      limit: 10,
    });

    const endpoint = vi.mocked(client.getTokenRequired).mock.calls[0][0];
    expect(endpoint).toContain("/search/issues?q=");
    expect(decodeURIComponent(endpoint)).toContain("is:issue repo:owner/repo");
    expect(decodeURIComponent(endpoint)).not.toContain("state:all");
    expect(decodeURIComponent(endpoint)).toContain('label:"help wanted"');
  });

  it("updates, comments, locks, and unlocks issues", async () => {
    await issues.update(3, { state: "closed" }, "owner/repo");
    await issues.comment(3, "Done", "owner/repo");
    await issues.lock(3, "owner/repo");
    await issues.unlock(3, "owner/repo");

    expect(client.patchTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/issues/3",
      { state: "closed" },
    );

    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/issues/3/comments",
      { body: "Done" },
    );

    expect(client.putTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/issues/3/lock",
      {},
    );

    expect(client.deleteTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/issues/3/lock",
    );
  });

  it("uses GraphQL for node-based lifecycle operations", async () => {
    await issues.delete("I_1");
    await issues.pin("I_1");
    await issues.unpin("I_1");
    await issues.transfer("I_1", "R_1");

    expect(client.graphqlTokenRequired).toHaveBeenCalledTimes(4);
    expect(client.graphqlTokenRequired).toHaveBeenLastCalledWith(
      expect.stringContaining("transferIssue"),
      { issueId: "I_1", repositoryId: "R_1" },
    );
  });
});
