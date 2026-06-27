import fs from "fs";
import { describe, it, expect, vi, Mock, beforeEach, afterEach } from "vitest";

import api from "@/api/repos";
import logger from "@/core/logger";
import progress from "@/core/progress";
import service from "@/services/repos";

vi.mock("@/core/repo", () => ({
  default: {
    resolveRepoSync: vi.fn(() => "owner/default"),
    resolveRepo: vi.fn(() => Promise.resolve("owner/default")),
  },
}));

vi.mock("fs", () => ({
  default: {
    readFileSync: vi.fn(),
  },
}));

vi.mock("@/api/repos", () => ({
  default: {
    fetchOrg: vi.fn(),
    fetchUser: vi.fn(),
  },
}));

vi.mock("@/core/output", () => ({
  default: {
    renderTable: vi.fn(),
    renderSummary: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    warn: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/core/progress", () => ({
  default: {
    withProgress: vi.fn(),
  },
}));

describe("repos service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should resolve repos from --repos", async () => {
    const result = await service.resolveTargets({
      repos: "owner/one,owner/two",
    });

    expect(result.map((repo) => repo.fullName)).toEqual([
      "owner/one",
      "owner/two",
    ]);
  });

  it("should resolve repos from --file (plain text)", async () => {
    (fs.readFileSync as Mock).mockReturnValue("owner/one\nowner/two\n");
    const result = await service.resolveTargets({ file: "/tmp/repos.txt" });

    expect(result.map((repo) => repo.fullName)).toEqual([
      "owner/one",
      "owner/two",
    ]);
  });

  it("should resolve repos from --file (JSON array)", async () => {
    (fs.readFileSync as Mock).mockReturnValue(
      JSON.stringify(["owner/one", "owner/two"]),
    );

    const result = await service.resolveTargets({ file: "/tmp/repos.json" });
    expect(result.map((repo) => repo.fullName)).toEqual([
      "owner/one",
      "owner/two",
    ]);
  });

  it("should resolve repos from --file (JSON object with repos key)", async () => {
    (fs.readFileSync as Mock).mockReturnValue(
      JSON.stringify({ repos: ["owner/one", "owner/two"] }),
    );

    const result = await service.resolveTargets({ file: "/tmp/repos.json" });
    expect(result.map((repo) => repo.fullName)).toEqual([
      "owner/one",
      "owner/two",
    ]);
  });

  it("should throw for empty file", async () => {
    (fs.readFileSync as Mock).mockReturnValue("");

    await expect(
      service.resolveTargets({ file: "/tmp/empty.txt" }),
    ).rejects.toThrow("No repository target provided.");
  });

  it("should resolve repos from --org", async () => {
    (api.fetchOrg as Mock).mockResolvedValue([
      {
        id: 1,
        name: "one",
        fork: false,
        private: false,
        pushedAt: null,
        archived: false,
        fullName: "owner/one",
        defaultBranch: "main",
      },
    ]);

    const result = await service.resolveTargets({ org: "owner" });
    expect(result.map((repo) => repo.fullName)).toEqual(["owner/one"]);
  });

  it("should resolve repos from --user", async () => {
    (api.fetchUser as Mock).mockResolvedValue([
      {
        id: 10,
        fork: false,
        private: false,
        name: "project",
        archived: false,
        defaultBranch: "main",
        pushedAt: "2024-06-01",
        fullName: "octocat/project",
      },
    ]);

    const result = await service.resolveTargets({ user: "octocat" });
    expect(result.map((repo) => repo.fullName)).toEqual(["octocat/project"]);
  });

  it("should deduplicate repositories", async () => {
    const result = await service.resolveTargets({
      repos: "owner/one,owner/one",
    });

    expect(result).toHaveLength(1);
  });

  it("should fall back to git remote when no target options", async () => {
    const result = await service.resolveTargets({});
    expect(result.map((repo) => repo.fullName)).toEqual(["owner/default"]);
  });

  it("should apply the limit", async () => {
    const result = await service.resolveTargets({
      limit: 1,
      repos: "owner/one,owner/two",
    });

    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe("owner/one");
  });

  it("should throw for invalid limit", async () => {
    await expect(service.resolveTargets({ limit: -1 })).rejects.toThrow(
      "Invalid limit: -1.",
    );
  });

  it("should throw for invalid limit string", async () => {
    await expect(service.resolveTargets({ limit: "abc" })).rejects.toThrow(
      "Invalid limit: abc.",
    );
  });

  it("should throw when no repo target", async () => {
    (fs.readFileSync as Mock).mockReturnValue("");

    await expect(
      service.resolveTargets({ file: "/tmp/empty.txt" }),
    ).rejects.toThrow("No repository target provided.");
  });

  it("should parse months with fallback", () => {
    expect(service.parseMonths(undefined, 12)).toBe(12);
  });

  it("should parse months from string", () => {
    expect(service.parseMonths("6", 12)).toBe(6);
  });

  it("should parse months from number", () => {
    expect(service.parseMonths(3, 12)).toBe(3);
  });

  it("should throw for invalid months", () => {
    expect(() => service.parseMonths("abc", 12)).toThrow(
      "Invalid months value: abc.",
    );

    expect(() => service.parseMonths(0, 12)).toThrow(
      "Invalid months value: 0.",
    );

    expect(() => service.parseMonths(-1, 12)).toThrow(
      "Invalid months value: -1.",
    );
  });

  it("should parse period default", () => {
    const date = service.parsePeriod();
    const expected = new Date();
    expected.setDate(expected.getDate() - 30);
    expect(date.getDate()).toBe(expected.getDate());
  });

  it("should parse period days", () => {
    const date = service.parsePeriod("7d");
    const expected = new Date();
    expected.setDate(expected.getDate() - 7);
    expect(date.getDate()).toBe(expected.getDate());
  });

  it("should parse period weeks", () => {
    const date = service.parsePeriod("2w");
    const expected = new Date();
    expected.setDate(expected.getDate() - 14);
    expect(date.getDate()).toBe(expected.getDate());
  });

  it("should parse period months", () => {
    const date = service.parsePeriod("3m");
    const expected = new Date();
    expected.setMonth(expected.getMonth() - 3);
    expect(date.getMonth()).toBe(expected.getMonth());
  });

  it("should throw for invalid period", () => {
    expect(() => service.parsePeriod("abc")).toThrow("Invalid period: abc.");
    expect(() => service.parsePeriod("1x")).toThrow("Invalid period: 1x.");
  });

  it("should get inactive months for null", () => {
    expect(service.getInactiveMonths(null)).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("should get inactive months for date", () => {
    const pushedAt = new Date();
    pushedAt.setMonth(pushedAt.getMonth() - 3);
    const result = service.getInactiveMonths(pushedAt.toISOString());
    expect(result).toBeGreaterThanOrEqual(3);
    expect(result).toBeLessThanOrEqual(4);
  });

  it("should require mutation confirmation", () => {
    expect(() => service.requireMutationConfirmation(false, false)).toThrow();

    expect(() =>
      service.requireMutationConfirmation(true, false),
    ).not.toThrow();

    expect(() =>
      service.requireMutationConfirmation(false, true),
    ).not.toThrow();
  });

  it("should run bulk with all successes", async () => {
    const repos = [
      {
        id: 1,
        name: "one",
        fork: false,
        private: false,
        pushedAt: null,
        archived: false,
        fullName: "owner/one",
        defaultBranch: "main",
      },
    ];

    (progress.withProgress as Mock).mockResolvedValue({
      results: [
        {
          metadata: { ok: true },
          success: true,
          repo: "owner/one",
        },
      ],
      errors: [undefined],
    });

    const result = await service.runBulk(repos, async () => ({ ok: true }));
    expect(result.success).toBe(true);
    expect(result.metadata.completed).toBe(1);
    expect(result.metadata.failed).toBe(0);
  });

  it("should run bulk with errors", async () => {
    const repos = [
      {
        id: 1,
        name: "one",
        fork: false,
        private: false,
        pushedAt: null,
        archived: false,
        fullName: "owner/one",
        defaultBranch: "main",
      },
    ];

    (progress.withProgress as Mock).mockResolvedValue({
      results: [undefined],
      errors: [{ item: "owner/one", error: "network error" }],
    });

    const result = await service.runBulk(repos, async () => {
      throw new Error("fail");
    });

    expect(result.success).toBe(false);
    expect(result.metadata.failed).toBe(1);
    expect(result.metadata.completed).toBe(0);
  });

  it("should render bulk results with failures", () => {
    service.renderBulkResults(
      "Summary",
      {
        success: false,

        metadata: {
          failed: 1,
          completed: 1,

          results: [
            {
              success: true,
              repo: "owner/ok",
              metadata: { foo: 1 },
            },

            {
              error: "boom",
              success: false,
              repo: "owner/fail",
            },
          ],
        },
      },
      (_repo, metadata) => metadata as Record<string, unknown>,
    );

    expect(logger.warn).toHaveBeenCalledWith(
      "1 repository operation(s) failed.",
    );
  });

  it("should render bulk results with all successes", () => {
    service.renderBulkResults(
      "Summary",
      {
        success: true,

        metadata: {
          failed: 0,
          completed: 2,

          results: [
            {
              success: true,
              repo: "owner/one",
              metadata: { foo: 1 },
            },

            {
              success: true,
              repo: "owner/two",
              metadata: { foo: 2 },
            },
          ],
        },
      },
      (_repo, metadata) => metadata as Record<string, unknown>,
    );

    expect(logger.success).toHaveBeenCalledWith(
      "All repository operations completed successfully.",
    );
  });
});
