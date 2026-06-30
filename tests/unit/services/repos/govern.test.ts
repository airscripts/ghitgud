import rulesets from "@/api/rulesets";
import service from "@/services/repos";
import governService from "@/services/repos/govern";
import { describe, it, expect, vi, Mock, beforeEach, afterEach } from "vitest";

const { readDefinition } = vi.hoisted(() => ({ readDefinition: vi.fn() }));
vi.mock("@/services/ruleset", () => ({
  readDefinition,
}));

vi.mock("@/api/rulesets", () => ({
  default: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/services/repos", () => ({
  default: {
    runBulk: vi.fn(),
    resolveTargets: vi.fn(),
    renderBulkResults: vi.fn(),
    requireMutationConfirmation: vi.fn(),
  },
}));

describe("repo govern service", () => {
  beforeEach(() => {
    readDefinition.mockReturnValue({ name: "main-protection", rules: [] });

    (service.resolveTargets as Mock).mockResolvedValue([
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should report would_update in dry-run mode", async () => {
    (rulesets.list as Mock).mockResolvedValue([
      { id: 1, name: "main-protection" },
    ]);

    const result = await governService.govern({
      dryRun: true,
      repos: "owner/repo",
      ruleset: "/tmp/ruleset.json",
    });

    expect(result.metadata.results[0].metadata).toEqual({
      dryRun: true,
      action: "would_update",
      ruleset: "main-protection",
    });
  });

  it("should create a missing ruleset", async () => {
    (rulesets.list as Mock).mockResolvedValue([]);

    await governService.govern({
      yes: true,
      repos: "owner/repo",
      ruleset: "/tmp/ruleset.json",
    });

    expect(rulesets.create).toHaveBeenCalled();
  });

  it("should update an existing ruleset by name", async () => {
    (rulesets.list as Mock).mockResolvedValue([
      { id: 1, name: "main-protection" },
    ]);

    await governService.govern({
      yes: true,
      repos: "owner/repo",
      ruleset: "/tmp/ruleset.json",
    });

    expect(rulesets.update).toHaveBeenCalledWith(
      "owner/repo",
      1,
      expect.objectContaining({ name: "main-protection" }),
    );
  });
});
