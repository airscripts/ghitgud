import { execSync } from "child_process";

import service from "@/services/repos";
import cloneService from "@/services/repos/clone";
import { describe, it, expect, vi, Mock, beforeEach, afterEach } from "vitest";

vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

vi.mock("@/api/repos", () => ({
  default: {
    fetchOrg: vi.fn(),
    fetchUser: vi.fn(),
  },
}));

vi.mock("@/services/repos", () => ({
  default: {
    runBulk: vi.fn(),
    resolveTargets: vi.fn(),
    renderBulkResults: vi.fn(),
  },
}));

vi.mock("@/core/output", () => ({
  default: {
    log: vi.fn(),
    renderTable: vi.fn(),
    renderSummary: vi.fn(),
  },
}));

vi.mock("@/core/errors", () => ({
  GhitgudError: class extends Error {},
}));

const makeRepo = (
  fullName: string,
  overrides: Record<string, unknown> = {},
) => ({
  id: 1,
  fullName,
  fork: false,
  private: false,
  archived: false,
  defaultBranch: "main",
  pushedAt: "2024-01-01",
  name: fullName.split("/")[1],
  ...overrides,
});

describe("clone service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("clone", () => {
    it("should resolve targets and run bulk clone by org", async () => {
      const repos = [makeRepo("org/repo1"), makeRepo("org/repo2")];
      (service.resolveTargets as Mock).mockResolvedValue(repos);

      (service.runBulk as Mock).mockResolvedValue({
        success: true,
        metadata: { failed: 0, completed: 2, results: [] },
      });

      await cloneService.clone({ org: "org" });
      expect(service.resolveTargets).toHaveBeenCalledWith({ org: "org" });
      expect(service.runBulk).toHaveBeenCalled();
      expect(service.renderBulkResults).toHaveBeenCalled();
    });

    it("should resolve targets and run bulk clone by user", async () => {
      const repos = [makeRepo("octocat/repo1")];
      (service.resolveTargets as Mock).mockResolvedValue(repos);

      (service.runBulk as Mock).mockResolvedValue({
        success: true,
        metadata: { failed: 0, completed: 1, results: [] },
      });

      await cloneService.clone({ user: "octocat" });
      expect(service.resolveTargets).toHaveBeenCalledWith({ user: "octocat" });
    });

    it("should filter out forks by default", async () => {
      const repos = [
        makeRepo("org/repo1"),
        makeRepo("org/fork1", { fork: true }),
      ];

      (service.resolveTargets as Mock).mockResolvedValue(repos);
      (service.runBulk as Mock).mockResolvedValue({
        success: true,
        metadata: { failed: 0, completed: 1, results: [] },
      });

      await cloneService.clone({ org: "org" });
      const filtered = (service.runBulk as Mock).mock.calls[0][0];
      expect(filtered).toHaveLength(1);
      expect(filtered[0].fullName).toBe("org/repo1");
    });

    it("should include forks when includeForks is true", async () => {
      const repos = [
        makeRepo("org/repo1"),
        makeRepo("org/fork1", { fork: true }),
      ];

      (service.resolveTargets as Mock).mockResolvedValue(repos);
      (service.runBulk as Mock).mockResolvedValue({
        success: true,
        metadata: { failed: 0, completed: 2, results: [] },
      });

      await cloneService.clone({ org: "org", includeForks: true });
      const filtered = (service.runBulk as Mock).mock.calls[0][0];
      expect(filtered).toHaveLength(2);
    });

    it("should filter out private repos by default", async () => {
      const repos = [
        makeRepo("org/repo1"),
        makeRepo("org/priv1", { private: true }),
      ];

      (service.resolveTargets as Mock).mockResolvedValue(repos);
      (service.runBulk as Mock).mockResolvedValue({
        success: true,
        metadata: { failed: 0, completed: 1, results: [] },
      });

      await cloneService.clone({ org: "org" });
      const filtered = (service.runBulk as Mock).mock.calls[0][0];
      expect(filtered).toHaveLength(1);
      expect(filtered[0].fullName).toBe("org/repo1");
    });

    it("should include private repos when includePrivate is true", async () => {
      const repos = [
        makeRepo("org/repo1"),
        makeRepo("org/priv1", { private: true }),
      ];

      (service.resolveTargets as Mock).mockResolvedValue(repos);
      (service.runBulk as Mock).mockResolvedValue({
        success: true,
        metadata: { failed: 0, completed: 2, results: [] },
      });

      await cloneService.clone({ org: "org", includePrivate: true });
      const filtered = (service.runBulk as Mock).mock.calls[0][0];
      expect(filtered).toHaveLength(2);
    });

    it("should use HTTPS by default", async () => {
      const repos = [makeRepo("org/repo1")];
      (service.resolveTargets as Mock).mockResolvedValue(repos);
      (service.runBulk as Mock).mockImplementation(
        async (
          _targets: unknown[],
          handler: (target: unknown) => Promise<unknown>,
        ) => {
          const results = [];

          for (const target of _targets) {
            results.push(await handler(target));
          }

          return {
            success: true,
            metadata: { failed: 0, completed: results.length, results },
          };
        },
      );

      (execSync as Mock).mockImplementation((cmd: string) => {
        if (cmd.startsWith("test -d")) {
          throw new Error("not a directory");
        }

        return "";
      });

      await cloneService.clone({ org: "org" });
      expect(execSync).toHaveBeenCalledWith(
        "git clone https://github.com/org/repo1.git",
        { stdio: "pipe" },
      );
    });

    it("should use SSH when protocol is ssh", async () => {
      const repos = [makeRepo("org/repo1")];
      (service.resolveTargets as Mock).mockResolvedValue(repos);
      (service.runBulk as Mock).mockImplementation(
        async (
          _targets: unknown[],
          handler: (target: unknown) => Promise<unknown>,
        ) => {
          const results = [];

          for (const target of _targets) {
            results.push(await handler(target));
          }

          return {
            success: true,
            metadata: { failed: 0, completed: results.length, results },
          };
        },
      );

      (execSync as Mock).mockImplementation((cmd: string) => {
        if (cmd.startsWith("test -d")) {
          throw new Error("not a directory");
        }

        return "";
      });

      await cloneService.clone({ org: "org", protocol: "ssh" });

      expect(execSync).toHaveBeenCalledWith(
        "git clone git@github.com:org/repo1.git",
        { stdio: "pipe" },
      );
    });

    it("should skip repos that already exist locally", async () => {
      const repos = [makeRepo("org/existing")];
      (service.resolveTargets as Mock).mockResolvedValue(repos);
      (service.runBulk as Mock).mockImplementation(
        async (
          _targets: unknown[],
          handler: (target: unknown) => Promise<unknown>,
        ) => {
          const results = [];

          for (const target of _targets) {
            results.push(await handler(target));
          }

          return {
            success: true,
            metadata: { failed: 0, completed: results.length, results },
          };
        },
      );

      (execSync as Mock).mockImplementation(() => "");
      await cloneService.clone({ org: "org" });

      const cloneCalls = (execSync as Mock).mock.calls
        .map((call: string[]) => call[0])
        .filter((cmd: string) => cmd.startsWith("git clone"));
      expect(cloneCalls).toHaveLength(0);
    });

    it("should not clone in dry-run mode", async () => {
      const repos = [makeRepo("org/repo1")];
      (service.resolveTargets as Mock).mockResolvedValue(repos);
      (service.runBulk as Mock).mockImplementation(
        async (
          _targets: unknown[],
          handler: (target: unknown) => Promise<unknown>,
        ) => {
          const results = [];

          for (const target of _targets) {
            results.push(await handler(target));
          }

          return {
            success: true,
            metadata: { failed: 0, completed: results.length, results },
          };
        },
      );

      (execSync as Mock).mockImplementation(() => {
        throw new Error("not a directory");
      });

      await cloneService.clone({ org: "org", dryRun: true });
      const cloneCalls = (execSync as Mock).mock.calls
        .map((call: string[]) => call[0])
        .filter((cmd: string) => cmd.startsWith("git clone"));
      expect(cloneCalls).toHaveLength(0);
    });

    it("should call renderBulkResults with Clone Summary", async () => {
      const repos = [makeRepo("org/repo1")];
      (service.resolveTargets as Mock).mockResolvedValue(repos);

      (service.runBulk as Mock).mockResolvedValue({
        success: true,
        metadata: { failed: 0, completed: 1, results: [] },
      });

      await cloneService.clone({ org: "org" });
      expect(service.renderBulkResults).toHaveBeenCalledWith(
        "Clone Summary",
        expect.any(Object),
        expect.any(Function),
      );
    });
  });

  describe("fetchUserAndClone", () => {
    it("should delegate to clone with user option", async () => {
      (service.resolveTargets as Mock).mockResolvedValue([]);

      (service.runBulk as Mock).mockResolvedValue({
        success: true,
        metadata: { failed: 0, completed: 0, results: [] },
      });

      await cloneService.fetchUserAndClone("octocat", {});
      expect(service.resolveTargets).toHaveBeenCalledWith({
        user: "octocat",
        repos: undefined,
      });
    });
  });
});
