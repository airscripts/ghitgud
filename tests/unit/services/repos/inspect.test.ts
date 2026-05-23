import contents from "@/api/contents";
import service from "@/services/repos";
import inspectService from "@/services/repos/inspect";
import { describe, it, expect, vi, Mock, beforeEach, afterEach } from "vitest";

vi.mock("@/api/contents", () => ({
  default: {
    list: vi.fn(),
    exists: vi.fn(),
    existsAny: vi.fn(),
  },
}));

vi.mock("@/services/repos", () => ({
  default: {
    runBulk: vi.fn(),
    resolveTargets: vi.fn(),
  },
}));

describe("repo inspect service", () => {
  beforeEach(() => {
    (service.resolveTargets as Mock).mockResolvedValue([
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

  it("should detect present and missing files", async () => {
    (contents.list as Mock).mockResolvedValue([
      { name: "README.md" },
      { name: "LICENSE" },
    ]);

    (contents.exists as Mock).mockResolvedValue(false);
    (contents.existsAny as Mock).mockResolvedValue(false);

    const result = await inspectService.inspect({ repos: "owner/repo" });
    const metadata = result.metadata.results[0].metadata;

    expect(metadata).toEqual({
      score: 50,
      present: ["README", "LICENSE"],
      missing: ["SECURITY.md", "CODEOWNERS"],
    });
  });

  it("should check CODEOWNERS locations", async () => {
    (contents.list as Mock).mockResolvedValue([{ name: "README" }]);
    (contents.exists as Mock).mockResolvedValue(true);
    (contents.existsAny as Mock).mockResolvedValue(true);

    await inspectService.inspect({ repos: "owner/repo" });
    expect(contents.existsAny).toHaveBeenCalled();
  });
});
