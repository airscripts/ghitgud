import { describe, it, expect, vi, beforeEach, Mock } from "vitest";

import api from "@/api/pr";
import io from "@/core/io";
import git from "@/core/git";
import logger from "@/core/logger";
import stackService from "@/services/stack";
import { GhitgudError } from "@/core/errors";

vi.mock("@/api/pr", () => ({
  default: {
    listOpen: vi.fn(),
    createPr: vi.fn(),
    updatePr: vi.fn(),
  },
}));

vi.mock("@/core/git", () => ({
  default: {
    getCurrentBranch: vi.fn(),
    getDefaultBranch: vi.fn(),
    branchExistsLocally: vi.fn(),
    listBranches: vi.fn(),
    rebaseBranch: vi.fn(),
    pushBranch: vi.fn(),
    checkoutBranch: vi.fn(),
  },
}));

vi.mock("@/core/io", () => ({
  default: {
    fileExists: vi.fn(),
    readJsonFile: vi.fn(),
    writeJsonFile: vi.fn(),
    ensureDir: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    warn: vi.fn(),
    error: vi.fn(),
    start: vi.fn(),
    success: vi.fn(),
  },
}));

function mockPr(overrides: Record<string, unknown> = {}) {
  return {
    number: 1,
    title: "PR",
    state: "open",
    merged: false,
    head: {
      ref: "feature",
      repo: {
        full_name: "owner/repo",
        html_url: "https://github.com/owner/repo",
      },
    },
    base: { ref: "main" },
    merge_commit_sha: null,
    ...overrides,
  };
}

describe("stack service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("creates stack entry for current branch with auto parent", async () => {
      (git.getCurrentBranch as Mock).mockReturnValue("feature");
      (git.getDefaultBranch as Mock).mockReturnValue("main");
      (git.branchExistsLocally as Mock).mockReturnValue(true);
      (io.fileExists as Mock).mockReturnValue(false);

      const result = await stackService.create({ base: "auto" });
      expect(result.success).toBe(true);
      expect(io.writeJsonFile).toHaveBeenCalled();

      expect(logger.success).toHaveBeenCalledWith(
        expect.stringContaining('Stack initialized for branch "feature"'),
      );
    });

    it("creates stack entry with explicit base", async () => {
      (git.getCurrentBranch as Mock).mockReturnValue("feature");
      (git.getDefaultBranch as Mock).mockReturnValue("main");
      (git.branchExistsLocally as Mock).mockReturnValue(true);
      (io.fileExists as Mock).mockReturnValue(false);

      const result = await stackService.create({ base: "develop" });
      expect(result.success).toBe(true);
      const writtenData = (io.writeJsonFile as Mock).mock.calls[0][1];
      expect(writtenData.stacks.feature.parent).toBe("develop");
    });

    it("throws when current branch cannot be determined", async () => {
      (git.getCurrentBranch as Mock).mockReturnValue("");
      (git.branchExistsLocally as Mock).mockReturnValue(false);

      await expect(stackService.create({ base: "auto" })).rejects.toThrow(
        GhitgudError,
      );
    });
  });

  describe("list", () => {
    it("returns info when current branch has no stack", async () => {
      (git.getCurrentBranch as Mock).mockReturnValue("feature");
      (io.fileExists as Mock).mockReturnValue(false);

      const result = await stackService.list();
      expect(result.success).toBe(true);
      expect(result.current).toBeNull();

      expect(logger.warn).toHaveBeenCalledWith(
        "Current branch is not part of a tracked stack.",
      );
    });

    it("returns stack info with parent and children", async () => {
      (git.getCurrentBranch as Mock).mockReturnValue("feature");
      (io.fileExists as Mock).mockReturnValue(true);

      (io.readJsonFile as Mock).mockReturnValue({
        stacks: {
          feature: { parent: "main", parentPr: null, children: ["feature-2"] },
        },
      });

      (api.listOpen as Mock).mockReturnValue({
        json: () => Promise.resolve([]),
      });

      const result = await stackService.list();
      expect(result.success).toBe(true);
      expect(result.parent).toBe("main");
      expect(result.children).toEqual(["feature-2 (no PR)"]);
    });
  });

  describe("update", () => {
    it("throws when current branch is not in stack", async () => {
      (git.getCurrentBranch as Mock).mockReturnValue("feature");
      (io.fileExists as Mock).mockReturnValue(false);

      await expect(stackService.update()).rejects.toThrow(
        "Current branch is not part of a tracked stack.",
      );
    });

    it("rebases children when parent PR is merged", async () => {
      (git.getCurrentBranch as Mock).mockReturnValue("feature");
      (io.fileExists as Mock).mockReturnValue(true);

      (io.readJsonFile as Mock).mockReturnValue({
        stacks: {
          feature: { parent: "main", parentPr: 10, children: ["feature-2"] },
          "feature-2": { parent: "feature", parentPr: null, children: [] },
        },
      });

      (api.listOpen as Mock).mockReturnValue({
        json: () => Promise.resolve([]),
      });

      (git.branchExistsLocally as Mock).mockReturnValue(true);
      (git.rebaseBranch as Mock).mockReturnValue(undefined);

      const result = await stackService.update();
      expect(result.success).toBe(true);
      expect(git.rebaseBranch).toHaveBeenCalledWith("feature-2", "main");
    });

    it("does nothing when parent PR is still open", async () => {
      (git.getCurrentBranch as Mock).mockReturnValue("feature");
      (io.fileExists as Mock).mockReturnValue(true);

      (io.readJsonFile as Mock).mockReturnValue({
        stacks: {
          feature: { parent: "main", parentPr: 10, children: ["feature-2"] },
        },
      });

      (api.listOpen as Mock).mockReturnValue({
        json: () =>
          Promise.resolve([
            mockPr({ number: 10, head: { ref: "main", repo: null } }),
          ]),
      });

      const result = await stackService.update();
      expect(result.success).toBe(true);
      expect(git.rebaseBranch).not.toHaveBeenCalled();
    });
  });

  describe("push", () => {
    it("throws when current branch is not in stack", async () => {
      (git.getCurrentBranch as Mock).mockReturnValue("feature");
      (io.fileExists as Mock).mockReturnValue(false);

      await expect(stackService.push({ draft: false })).rejects.toThrow(
        "Current branch is not part of a tracked stack.",
      );
    });

    it("pushes branches and creates PRs", async () => {
      (git.getCurrentBranch as Mock).mockReturnValue("feature");
      (io.fileExists as Mock).mockReturnValue(true);

      (io.readJsonFile as Mock).mockReturnValue({
        stacks: {
          feature: { parent: "main", parentPr: null, children: [] },
        },
      });

      (api.listOpen as Mock).mockReturnValue({
        json: () => Promise.resolve([]),
      });

      (git.branchExistsLocally as Mock).mockReturnValue(true);
      (git.pushBranch as Mock).mockReturnValue(undefined);
      (api.createPr as Mock).mockReturnValue(mockPr({ number: 42 }));

      const result = await stackService.push({
        draft: false,
        title: "feat: {branch}",
      });

      expect(result.success).toBe(true);
      expect(git.pushBranch).toHaveBeenCalledWith("feature");
      expect(api.createPr).toHaveBeenCalled();
    });

    it("updates existing PR base when changed", async () => {
      (git.getCurrentBranch as Mock).mockReturnValue("feature");
      (io.fileExists as Mock).mockReturnValue(true);

      (io.readJsonFile as Mock).mockReturnValue({
        stacks: {
          feature: { parent: "main", parentPr: null, children: [] },
        },
      });

      (api.listOpen as Mock).mockReturnValue({
        json: () =>
          Promise.resolve([
            mockPr({
              number: 5,
              base: { ref: "develop" },
              head: { ref: "feature", repo: null },
            }),
          ]),
      });

      (git.branchExistsLocally as Mock).mockReturnValue(true);
      (git.pushBranch as Mock).mockReturnValue(undefined);
      (api.updatePr as Mock).mockReturnValue(mockPr());

      const result = await stackService.push({ draft: false });
      expect(result.success).toBe(true);
      expect(api.updatePr).toHaveBeenCalledWith(5, { base: "main" });
    });
  });

  describe("next", () => {
    it("throws when current branch is not in stack", async () => {
      (git.getCurrentBranch as Mock).mockReturnValue("feature");
      (io.fileExists as Mock).mockReturnValue(false);

      await expect(stackService.next({})).rejects.toThrow(
        'Current branch "feature" is not part of a tracked stack.',
      );
    });

    it("checks out next child branch", async () => {
      (git.getCurrentBranch as Mock).mockReturnValue("feature");
      (io.fileExists as Mock).mockReturnValue(true);

      (io.readJsonFile as Mock).mockReturnValue({
        stacks: {
          feature: { parent: "main", parentPr: null, children: ["feature-2"] },
        },
      });

      (git.branchExistsLocally as Mock).mockReturnValue(true);
      (git.checkoutBranch as Mock).mockReturnValue(undefined);

      const result = await stackService.next({});
      expect(result.success).toBe(true);
      expect(result.branch).toBe("feature-2");
      expect(git.checkoutBranch).toHaveBeenCalledWith("feature-2");
    });

    it("checks out previous parent branch with reverse", async () => {
      (git.getCurrentBranch as Mock).mockReturnValue("feature");
      (io.fileExists as Mock).mockReturnValue(true);

      (io.readJsonFile as Mock).mockReturnValue({
        stacks: {
          feature: { parent: "main", parentPr: null, children: ["feature-2"] },
        },
      });

      (git.branchExistsLocally as Mock).mockReturnValue(true);
      (git.checkoutBranch as Mock).mockReturnValue(undefined);

      const result = await stackService.next({ reverse: true });
      expect(result.success).toBe(true);
      expect(result.branch).toBe("main");
      expect(git.checkoutBranch).toHaveBeenCalledWith("main");
    });

    it("throws when no next branch exists", async () => {
      (git.getCurrentBranch as Mock).mockReturnValue("feature");
      (io.fileExists as Mock).mockReturnValue(true);

      (io.readJsonFile as Mock).mockReturnValue({
        stacks: {
          feature: { parent: "main", parentPr: null, children: [] },
        },
      });

      await expect(stackService.next({})).rejects.toThrow(
        "No next branch in the stack",
      );
    });

    it("throws when no previous branch exists", async () => {
      (git.getCurrentBranch as Mock).mockReturnValue("feature");
      (io.fileExists as Mock).mockReturnValue(true);

      (io.readJsonFile as Mock).mockReturnValue({
        stacks: {
          feature: { parent: null, parentPr: null, children: [] },
        },
      });

      await expect(stackService.next({ reverse: true })).rejects.toThrow(
        "No previous branch in the stack",
      );
    });

    it("lists stack chain with list option", async () => {
      (git.getCurrentBranch as Mock).mockReturnValue("feature");
      (io.fileExists as Mock).mockReturnValue(true);

      (io.readJsonFile as Mock).mockReturnValue({
        stacks: {
          main: { parent: null, parentPr: null, children: ["feature"] },
          "feature-2": { parent: "feature", parentPr: null, children: [] },
          feature: { parent: "main", parentPr: null, children: ["feature-2"] },
        },
      });

      const result = await stackService.next({ list: true });
      expect(result.success).toBe(true);
      expect(result.chain).toEqual(["main", "feature", "feature-2"]);
    });
  });
});
