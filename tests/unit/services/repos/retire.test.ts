import reposApi from "@/api/repos";
import service from "@/services/repos";
import retireService from "@/services/repos/retire";
import { describe, it, expect, vi, Mock, beforeEach, afterEach } from "vitest";

vi.mock("@/api/repos", () => ({
  default: {
    archive: vi.fn(),
  },
}));

vi.mock("@/services/repos", () => ({
  default: {
    runBulk: vi.fn(),
    parseMonths: vi.fn(),
    resolveTargets: vi.fn(),
    renderBulkResults: vi.fn(),
    getInactiveMonths: vi.fn(),
    requireMutationConfirmation: vi.fn(),
  },
}));

describe("repo retire service", () => {
  beforeEach(() => {
    (service.parseMonths as Mock).mockReturnValue(12);
    (service.getInactiveMonths as Mock).mockReturnValue(18);

    (service.resolveTargets as Mock).mockResolvedValue([
      {
        id: 1,
        fork: false,
        name: "repo",
        private: false,
        archived: false,
        defaultBranch: "main",
        fullName: "owner/repo",
        pushedAt: "2024-01-10T00:00:00Z",
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

  it("should identify stale repos in dry-run mode", async () => {
    const result = await retireService.retire({
      dryRun: true,
      repos: "owner/repo",
    });

    expect(result.metadata.results[0].metadata!.action).toBe("would_retire");
  });

  it("should skip archived repos", async () => {
    (service.resolveTargets as Mock).mockResolvedValue([
      {
        id: 1,
        fork: false,
        name: "repo",
        private: false,
        archived: true,
        defaultBranch: "main",
        fullName: "owner/repo",
        pushedAt: "2024-01-10T00:00:00Z",
      },
    ]);

    const result = await retireService.retire({
      dryRun: true,
      repos: "owner/repo",
    });

    expect(result.metadata.results[0].metadata!.action).toBe(
      "skipped_archived",
    );
  });

  it("should skip forks when not including forks", async () => {
    (service.resolveTargets as Mock).mockResolvedValue([
      {
        id: 1,
        fork: true,
        name: "repo",
        private: false,
        archived: false,
        defaultBranch: "main",
        fullName: "owner/repo",
        pushedAt: "2024-01-10T00:00:00Z",
      },
    ]);

    const result = await retireService.retire({
      dryRun: true,
      repos: "owner/repo",
    });

    expect(result.metadata.results[0].metadata!.action).toBe("skipped_fork");
  });

  it("should include forks when includeForks is true", async () => {
    (service.resolveTargets as Mock).mockResolvedValue([
      {
        id: 1,
        fork: true,
        name: "repo",
        private: false,
        archived: false,
        defaultBranch: "main",
        fullName: "owner/repo",
        pushedAt: "2024-01-10T00:00:00Z",
      },
    ]);

    (service.getInactiveMonths as Mock).mockReturnValue(18);

    const result = await retireService.retire({
      dryRun: true,
      repos: "owner/repo",
      includeForks: true,
    });

    expect(result.metadata.results[0].metadata!.action).toBe("would_retire");
  });

  it("should skip private repos when not including private", async () => {
    (service.resolveTargets as Mock).mockResolvedValue([
      {
        id: 1,
        fork: false,
        name: "repo",
        private: true,
        archived: false,
        defaultBranch: "main",
        fullName: "owner/repo",
        pushedAt: "2024-01-10T00:00:00Z",
      },
    ]);

    const result = await retireService.retire({
      dryRun: true,
      repos: "owner/repo",
    });

    expect(result.metadata.results[0].metadata!.action).toBe("skipped_private");
  });

  it("should include private repos when includePrivate is true", async () => {
    (service.resolveTargets as Mock).mockResolvedValue([
      {
        id: 1,
        fork: false,
        name: "repo",
        private: true,
        archived: false,
        defaultBranch: "main",
        fullName: "owner/repo",
        pushedAt: "2024-01-10T00:00:00Z",
      },
    ]);

    (service.getInactiveMonths as Mock).mockReturnValue(18);

    const result = await retireService.retire({
      dryRun: true,
      repos: "owner/repo",
      includePrivate: true,
    });

    expect(result.metadata.results[0].metadata!.action).toBe("would_retire");
  });

  it("should skip recent repos", async () => {
    (service.getInactiveMonths as Mock).mockReturnValue(3);

    const result = await retireService.retire({
      dryRun: true,
      repos: "owner/repo",
    });

    expect(result.metadata.results[0].metadata!.action).toBe("skipped_recent");
  });

  it("should archive when confirmed", async () => {
    await retireService.retire({
      yes: true,
      repos: "owner/repo",
    });

    expect(reposApi.archive).toHaveBeenCalledWith("owner/repo");
  });

  it("should pass custom months threshold", async () => {
    await retireService.retire({
      months: 6,
      dryRun: true,
      repos: "owner/repo",
    });

    expect(service.parseMonths).toHaveBeenCalledWith(6, 12);
  });
});
