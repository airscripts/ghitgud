import { describe, expect, it, vi } from "vitest";

import git from "@/core/git";
import config from "@/core/config";
import { buildDashboardData } from "@/tui/state";

vi.mock("@/core/git", () => ({
  default: {
    isInsideRepo: vi.fn(),
    getCurrentBranch: vi.fn(),
  },
}));

vi.mock("@/core/config", () => ({
  default: {
    listProfiles: vi.fn(),
    getRepoOptional: vi.fn(),
    getTokenOptional: vi.fn(),
  },
}));

describe("tui state", () => {
  it("should build dashboard data from config and git", () => {
    vi.mocked(config.listProfiles).mockReturnValue([
      { name: "default", active: false, hasToken: false, repo: null },
      { name: "work", active: true, hasToken: true, repo: "owner/repo" },
    ]);

    vi.mocked(config.getRepoOptional).mockReturnValue("owner/repo");
    vi.mocked(config.getTokenOptional).mockReturnValue("token");
    vi.mocked(git.isInsideRepo).mockReturnValue(true);
    vi.mocked(git.getCurrentBranch).mockReturnValue("main");

    expect(buildDashboardData("1.2.3")).toEqual({
      branch: "main",
      tokenSet: true,
      profile: "work",
      version: "1.2.3",
      repo: "owner/repo",
    });
  });

  it("should tolerate missing config and git context", () => {
    vi.mocked(config.listProfiles).mockImplementation(() => {
      throw new Error("missing config");
    });

    vi.mocked(config.getRepoOptional).mockReturnValue(null);
    vi.mocked(config.getTokenOptional).mockReturnValue(null);
    vi.mocked(git.isInsideRepo).mockReturnValue(false);

    expect(buildDashboardData("1.2.3")).toEqual({
      repo: null,
      branch: null,
      profile: null,
      tokenSet: false,
      version: "1.2.3",
    });
  });
});
