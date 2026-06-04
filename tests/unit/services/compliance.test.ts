import { describe, it, expect, vi, beforeEach } from "vitest";

import reposApi from "@/api/repos";
import rulesetsApi from "@/api/rulesets";
import repoService from "@/services/repos";
import inspectService from "@/services/repos/inspect";
import complianceService from "@/services/compliance";

vi.mock("@/api/repos", () => ({
  default: {
    get: vi.fn(),
    getBranchProtection: vi.fn(),
  },
}));

vi.mock("@/api/rulesets", () => ({
  default: {
    list: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    start: vi.fn(),
  },
}));

vi.mock("@/services/repos/inspect", () => ({
  default: {
    inspectRepo: vi.fn(),
  },
}));

vi.mock("@/services/repos", () => ({
  default: {
    runBulk: vi.fn(),
    resolveTargets: vi.fn(),
    renderBulkResults: vi.fn(),
  },
}));

describe("compliance service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(repoService.runBulk).mockImplementation(
      async (repos, handler) => {
        const metadata = await handler(repos[0]);

        return {
          success: true,

          metadata: {
            failed: 0,
            completed: 1,
            results: [{ repo: repos[0].fullName, success: true, metadata }],
          },
        };
      },
    );
  });

  it("scores compliance checks with failures and unknowns", async () => {
    vi.mocked(repoService.resolveTargets).mockResolvedValue([
      {
        id: 1,
        fork: false,
        name: "repo",
        pushedAt: null,
        private: false,
        archived: true,
        defaultBranch: "",
        fullName: "owner/repo",
      },
    ]);

    vi.mocked(inspectService.inspectRepo).mockResolvedValue({
      score: 0,
      missing: ["README", "LICENSE", "SECURITY.md", "CODEOWNERS"],
      present: [],
    });

    vi.mocked(reposApi.getBranchProtection).mockRejectedValue(new Error("404"));
    vi.mocked(rulesetsApi.list).mockRejectedValue(new Error("403"));
    vi.mocked(reposApi.get).mockResolvedValue({
      id: 1,
      fork: false,
      name: "repo",
      private: false,
      archived: true,
      pushed_at: null,
      default_branch: "",
      full_name: "owner/repo",
      has_vulnerability_alerts: false,
    });

    const result = await complianceService.check({ repos: "owner/repo" });
    const metadata = result.metadata.results[0].metadata;

    expect(metadata?.score).toBe(0);
    expect(metadata?.checks).toHaveLength(9);
    expect(metadata?.remediation.length).toBeGreaterThan(0);
  });

  it("scores a fully compliant repository", async () => {
    vi.mocked(repoService.resolveTargets).mockResolvedValue([
      {
        id: 1,
        fork: false,
        name: "repo",
        pushedAt: null,
        private: false,
        archived: false,
        defaultBranch: "main",
        fullName: "owner/repo",
      },
    ]);

    vi.mocked(inspectService.inspectRepo).mockResolvedValue({
      score: 100,
      missing: [],
      present: ["README", "LICENSE", "SECURITY.md", "CODEOWNERS"],
    });

    vi.mocked(reposApi.getBranchProtection).mockResolvedValue({} as Response);
    vi.mocked(rulesetsApi.list).mockResolvedValue([{ id: 1, name: "main" }]);

    vi.mocked(reposApi.get).mockResolvedValue({
      id: 1,
      fork: false,
      name: "repo",
      private: false,
      archived: false,
      pushed_at: null,
      default_branch: "main",
      full_name: "owner/repo",
      has_vulnerability_alerts: true,
    });

    const result = await complianceService.check({ repos: "owner/repo" });
    const metadata = result.metadata.results[0].metadata;

    expect(metadata?.score).toBe(100);
    expect(metadata?.checks).toHaveLength(9);
    expect(metadata?.remediation).toEqual([]);
  });
});
