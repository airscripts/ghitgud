import { describe, it, expect, vi, beforeEach } from "vitest";

import config from "@/core/config";
import repoService from "@/services/repos";
import { GhitgudError } from "@/core/errors";
import dependabotApi from "@/api/dependabot";
import dependabotService from "@/services/dependabot";

vi.mock("@/api/dependabot", () => ({
  default: {
    listAlerts: vi.fn(),
    dismissAlert: vi.fn(),
  },
}));

vi.mock("@/core/config", () => ({
  default: {
    getRepo: vi.fn(() => "owner/repo"),
  },
}));

vi.mock("@/core/output", () => ({
  default: {
    renderSummary: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    start: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/services/repos", () => ({
  default: {
    runBulk: vi.fn(),
    resolveTargets: vi.fn(),
    renderBulkResults: vi.fn(),
  },
}));

describe("dependabot service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(repoService.resolveTargets).mockResolvedValue([
      {
        id: 1,
        fork: false,
        name: "repo",
        private: false,
        pushedAt: null,
        archived: false,
        defaultBranch: "main",
        fullName: "owner/repo",
      },
    ]);

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

  it("lists normalized alerts", async () => {
    vi.mocked(dependabotApi.listAlerts).mockResolvedValue([
      {
        number: 7,
        state: "open",

        dependency: {
          manifest_path: "package.json",
          package: { ecosystem: "npm", name: "left-pad" },
        },

        security_advisory: {
          severity: "high",
          summary: "Prototype pollution",
        },
      },
    ]);

    const result = await dependabotService.list({ repos: "owner/repo" });
    const metadata = result.metadata.results[0].metadata;

    expect(metadata).toEqual({
      alerts: [
        {
          number: 7,
          state: "open",
          severity: "high",
          ecosystem: "npm",
          dismissedReason: null,
          packageName: "left-pad",
          repository: "owner/repo",
          manifestPath: "package.json",
          advisory: "Prototype pollution",
        },
      ],
    });
  });

  it("requires --yes for dismissal", async () => {
    await expect(
      dependabotService.dismiss(1, {
        reason: "tolerable_risk",
      }),
    ).rejects.toThrow(GhitgudError);
  });

  it("dismisses alerts with a valid reason", async () => {
    vi.mocked(config.getRepo).mockReturnValue("owner/repo");
    vi.mocked(dependabotApi.dismissAlert).mockResolvedValue({} as Response);

    const result = await dependabotService.dismiss(1, {
      yes: true,
      reason: "tolerable_risk",
    });

    expect(result.metadata).toEqual({
      alert: 1,
      dismissed: true,
      repo: "owner/repo",
      reason: "tolerable_risk",
    });

    expect(dependabotApi.dismissAlert).toHaveBeenCalledWith("owner/repo", 1, {
      comment: undefined,
      reason: "tolerable_risk",
    });
  });
});
