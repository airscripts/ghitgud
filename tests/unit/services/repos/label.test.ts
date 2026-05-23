import service from "@/services/repos";
import labelsService from "@/services/labels";
import labelService from "@/services/repos/label";
import { describe, it, expect, vi, Mock, beforeEach, afterEach } from "vitest";

vi.mock("@/services/labels", () => ({
  default: {
    upsertLabels: vi.fn(),
    loadLabelsFromMetadata: vi.fn(),
    loadLabelsFromTemplate: vi.fn(),
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

describe("repo label service", () => {
  beforeEach(() => {
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

    (labelsService.loadLabelsFromTemplate as Mock).mockReturnValue([
      { name: "bug", color: "fff", description: "Bug" },
    ]);

    (labelsService.loadLabelsFromMetadata as Mock).mockReturnValue([
      { name: "bug", color: "fff", description: "Bug" },
    ]);

    (labelsService.upsertLabels as Mock).mockResolvedValue({
      created: ["bug"],
      updated: [],
      unchanged: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should load a built-in template", async () => {
    await labelService.label({
      dryRun: true,
      repos: "owner/repo",
      template: "conventional",
    });

    expect(labelsService.loadLabelsFromTemplate).toHaveBeenCalled();
  });

  it("should load a metadata file", async () => {
    await labelService.label({
      dryRun: true,
      repos: "owner/repo",
      metadata: "/tmp/labels.json",
    });

    expect(labelsService.loadLabelsFromMetadata).toHaveBeenCalledWith(
      "/tmp/labels.json",
    );
  });

  it("should upsert labels across multiple repos", async () => {
    await labelService.label({
      dryRun: true,
      repos: "owner/repo",
      template: "conventional",
    });

    expect(labelsService.upsertLabels).toHaveBeenCalledWith(
      expect.any(Array),
      "owner/repo",
      { dryRun: true },
    );
  });
});
