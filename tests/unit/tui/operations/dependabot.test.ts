import { describe, it, expect, vi, beforeEach } from "vitest";

import dependabotService from "@/services/dependabot";
import dependabotOperations from "@/tui/operations/dependabot";

vi.mock("@/services/dependabot", () => ({
  default: {
    list: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock("@/core/repo", () => ({
  default: {
    resolveRepo: vi.fn().mockResolvedValue("airscripts/ghitgud"),
    resolveRepoSync: vi.fn().mockReturnValue("airscripts/ghitgud"),
    resolveRepos: vi.fn().mockResolvedValue(["airscripts/ghitgud"]),
  },
}));

describe("tui dependabot operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs dependabot.list", async () => {
    vi.mocked(dependabotService.list).mockResolvedValue({
      success: true,
      metadata: { failed: 0, completed: 0, results: [] },
    });

    const op = dependabotOperations.find((o) => o.id === "dependabot.list")!;
    await op.run({ values: {} });

    expect(dependabotService.list).toHaveBeenCalledWith({
      org: undefined,
      file: undefined,
      repos: undefined,
      limit: undefined,
      state: undefined,
      scope: undefined,
      after: undefined,
      before: undefined,
      package: undefined,
      severity: undefined,
      ecosystem: undefined,
    });
  });

  it("runs dependabot.dismiss", async () => {
    vi.mocked(dependabotService.dismiss).mockResolvedValue({
      success: true,

      metadata: {
        alert: 1,
        dismissed: true,
        reason: "fix_started",
        repo: "airscripts/ghitgud",
      },
    });

    const op = dependabotOperations.find((o) => o.id === "dependabot.dismiss")!;
    await op.run({
      values: { alert: 1, reason: "fix_started", yes: true },
    });

    expect(dependabotService.dismiss).toHaveBeenCalledWith(1, {
      yes: true,
      comment: undefined,
      reason: "fix_started",
      repo: "airscripts/ghitgud",
    });
  });
});
