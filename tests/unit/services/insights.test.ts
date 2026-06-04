import api from "@/api/insights";
import output from "@/core/output";
import spinner from "@/core/spinner";
import insights from "@/services/insights";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/api/insights", () => ({
  default: {
    getReferrers: vi.fn(),
    getPopularPaths: vi.fn(),
    getContributors: vi.fn(),
    getTrafficViews: vi.fn(),
    getParticipation: vi.fn(),
    getTrafficClones: vi.fn(),
    getCodeFrequency: vi.fn(),
    getCommitActivity: vi.fn(),
  },
}));

vi.mock("@/core/spinner", () => ({
  default: {
    withSpinner: vi.fn(async (_message: string, task: () => Promise<unknown>) =>
      task(),
    ),
  },
}));

vi.mock("@/core/output", () => ({
  default: {
    renderTable: vi.fn(),
    renderSection: vi.fn(),
  },
}));

describe("insights service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("summarizes traffic", async () => {
    vi.mocked(api.getTrafficViews).mockResolvedValue({
      views: [],
      count: 100,
      uniques: 25,
    });

    vi.mocked(api.getTrafficClones).mockResolvedValue({
      count: 40,
      clones: [],
      uniques: 10,
    });

    await expect(insights.traffic("owner/repo")).resolves.toEqual({
      views: { count: 100, uniques: 25 },
      clones: { count: 40, uniques: 10 },
    });

    expect(spinner.withSpinner).toHaveBeenCalled();
  });

  it("summarizes contributors", async () => {
    vi.mocked(api.getContributors).mockResolvedValue([
      { id: 1, login: "alice", contributions: 12 },
      { id: 2, login: "bob", contributions: 5 },
    ]);

    await expect(insights.contributors("owner/repo")).resolves.toEqual([
      { login: "alice", contributions: 12 },
      { login: "bob", contributions: 5 },
    ]);
  });

  it("summarizes empty and populated commit activity", async () => {
    vi.mocked(api.getCommitActivity).mockResolvedValueOnce([]);

    await expect(insights.commits("owner/repo")).resolves.toEqual({
      totalWeeks: 0,
      averagePerWeek: 0,
      mostActiveWeek: null,
    });

    vi.mocked(api.getCommitActivity).mockResolvedValueOnce([
      { week: 1767225600, total: 2, days: [] },
      { week: 1767830400, total: 8, days: [] },
    ]);

    await expect(insights.commits("owner/repo")).resolves.toEqual({
      totalWeeks: 2,
      averagePerWeek: 5,
      mostActiveWeek: { week: "2026-01-08", commits: 8 },
    });
  });

  it("summarizes code frequency", async () => {
    vi.mocked(api.getCodeFrequency).mockResolvedValue([
      [1767225600, 10, -3],
      [1767830400, 4, -8],
    ]);

    await expect(insights.codeFrequency("owner/repo")).resolves.toEqual({
      net: 3,
      additions: 14,
      deletions: 11,
    });
  });

  it("summarizes popularity and participation", async () => {
    vi.mocked(api.getReferrers).mockResolvedValue([
      { referrer: "github.com", count: 10, uniques: 3 },
    ]);

    vi.mocked(api.getPopularPaths).mockResolvedValue([
      { path: "/readme", title: "README", count: 7, uniques: 2 },
    ]);

    vi.mocked(api.getParticipation).mockResolvedValue({
      all: [1, 2],
      owner: [3, 4],
    });

    await expect(insights.popularity("owner/repo")).resolves.toEqual({
      referrers: [{ referrer: "github.com", count: 10, uniques: 3 }],
      paths: [{ path: "/readme", title: "README", count: 7, uniques: 2 }],
    });

    await expect(insights.participation("owner/repo")).resolves.toEqual({
      allTime: [1, 2],
      ownerTime: [3, 4],
    });
  });

  it("renders formatted sections", () => {
    insights.formatTraffic({
      views: { count: 1, uniques: 1 },
      clones: { count: 2, uniques: 2 },
    });

    insights.formatContributors([{ login: "alice", contributions: 10 }]);
    insights.formatCommits({
      totalWeeks: 0,
      averagePerWeek: 0,
      mostActiveWeek: null,
    });

    insights.formatCodeFrequency({ additions: 1, deletions: 2, net: -1 });
    insights.formatPopularity({
      referrers: [{ referrer: "github.com", count: 1, uniques: 1 }],
      paths: [{ path: "/readme", title: "README", count: 1, uniques: 1 }],
    });

    expect(output.renderSection).toHaveBeenCalledWith("Traffic (Last 14 days)");
    expect(output.renderSection).toHaveBeenCalledWith("Top Contributors");
    expect(output.renderSection).toHaveBeenCalledWith("Commit Activity");
    expect(output.renderSection).toHaveBeenCalledWith("Code Frequency");
    expect(output.renderSection).toHaveBeenCalledWith("Top Referrers");
    expect(output.renderSection).toHaveBeenCalledWith("Popular Paths");
    expect(output.renderTable).toHaveBeenCalled();
  });
});
