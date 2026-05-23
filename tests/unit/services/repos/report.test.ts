import pulls from "@/api/pulls";
import issues from "@/api/issues";
import commits from "@/api/commits";
import service from "@/services/repos";
import reportService from "@/services/repos/report";
import { describe, it, expect, vi, Mock, beforeEach, afterEach } from "vitest";

vi.mock("@/api/issues", () => ({
  default: {
    countOpen: vi.fn(),
    countStale: vi.fn(),
  },
}));

vi.mock("@/api/pulls", () => ({
  default: {
    countOpen: vi.fn(),
    listMergedSince: vi.fn(),
  },
}));

vi.mock("@/api/commits", () => ({
  default: {
    contributors: vi.fn(),
  },
}));

vi.mock("@/services/repos", () => ({
  default: {
    runBulk: vi.fn(),
    parsePeriod: vi.fn(),
    resolveTargets: vi.fn(),
    renderBulkResults: vi.fn(),
  },
}));

describe("repo report service", () => {
  beforeEach(() => {
    (service.parsePeriod as Mock).mockReturnValue(
      new Date("2026-04-23T00:00:00Z"),
    );

    (service.resolveTargets as Mock).mockResolvedValue([
      {
        id: 1,
        fork: false,
        name: "repo",
        private: false,
        archived: false,
        defaultBranch: "main",
        fullName: "owner/repo",
        pushedAt: "2026-05-12T10:00:00Z",
      },
    ]);

    (service.runBulk as Mock).mockImplementation(async (repos, handler) => {
      const metadata = await handler(repos[0]);

      return {
        success: true,
        metadata: {
          failed: 0,
          completed: 1,
          results: [{ repo: repos[0].fullName, success: true, metadata }],
        },
      };
    });

    (issues.countOpen as Mock).mockResolvedValue(12);
    (issues.countStale as Mock).mockResolvedValue(4);
    (pulls.countOpen as Mock).mockResolvedValue(3);

    (pulls.listMergedSince as Mock).mockResolvedValue([
      {
        created_at: "2026-04-25T00:00:00Z",
        merged_at: "2026-04-26T18:00:00Z",
      },
    ]);

    (commits.contributors as Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should count open issues and pull requests", async () => {
    const result = await reportService.report({
      since: "30d",
      repos: "owner/repo",
    });

    const metadata = result.metadata.results[0]!.metadata;

    expect(metadata!.openIssues).toBe(12);
    expect(metadata!.openPullRequests).toBe(3);
    expect(metadata!.mergedPullRequests).toBe(1);
    expect(metadata!.contributors).toBe(2);
  });

  it("should handle empty merged pull requests", async () => {
    (pulls.listMergedSince as Mock).mockResolvedValue([]);

    const result = await reportService.report({
      since: "30d",
      repos: "owner/repo",
    });

    expect(result.metadata.results[0].metadata!.averageMergeHours).toBe(0);
  });
});
