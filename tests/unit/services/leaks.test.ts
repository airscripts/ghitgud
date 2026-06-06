import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import git from "@/core/git";
import leaksApi from "@/api/leaks";
import repoService from "@/services/repos";
import leaksService from "@/services/leaks";

vi.mock("child_process", () => ({
  execFileSync: vi.fn(),
}));

vi.mock("@/core/git", () => ({
  default: {
    getRepoRoot: vi.fn(),
  },
}));

vi.mock("@/api/leaks", () => ({
  default: {
    listAlerts: vi.fn(),
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

describe("leaks service", () => {
  let tempDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ghg-leaks-"));
    vi.mocked(git.getRepoRoot).mockReturnValue(tempDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("scans tracked files and redacts findings", async () => {
    const token = "ghp_abcdefghijklmnopqrstuvwxyz123456";
    fs.writeFileSync(path.join(tempDir, "config.txt"), `TOKEN="${token}"`);
    vi.mocked(execFileSync).mockReturnValue("config.txt\n");

    const result = await leaksService.scan();
    const finding = result.metadata.findings[0];

    expect(finding.rule).toBe("classic-github-token");
    expect(finding.match).not.toContain(token);
    expect(finding.match).toContain("[redacted]");
  });

  it("respects a custom limit and falls back on invalid input", async () => {
    fs.writeFileSync(
      path.join(tempDir, "a.txt"),
      "ghp_abcdefghijklmnopqrstuvwxyz123456\n",
    );

    fs.writeFileSync(
      path.join(tempDir, "b.txt"),
      "ghp_abcdefghijklmnopqrstuvwxyz123456\n",
    );

    vi.mocked(execFileSync).mockReturnValue("a.txt\nb.txt\n");
    const limited = await leaksService.scan({ limit: 1 });
    expect(limited.metadata.findings).toHaveLength(1);

    const invalid = await leaksService.scan({ limit: "bad" });
    expect(invalid.metadata.findings.length).toBeLessThanOrEqual(100);
  });

  it("skips missing and non-text files", async () => {
    fs.writeFileSync(path.join(tempDir, "safe.txt"), "hello world\n");

    fs.writeFileSync(
      path.join(tempDir, "big.bin"),
      Buffer.alloc(1024 * 1024 + 1),
    );

    vi.mocked(execFileSync).mockReturnValue("safe.txt\nbig.bin\nmissing.txt\n");
    const result = await leaksService.scan();
    expect(result.metadata.findings).toHaveLength(0);
  });

  it("falls back to git history when no tracked-file findings", async () => {
    fs.writeFileSync(path.join(tempDir, "clean.txt"), "nothing here\n");

    vi.mocked(execFileSync)
      .mockReturnValueOnce("clean.txt\n")
      .mockReturnValueOnce("ghp_abcdefghijklmnopqrstuvwxyz123456\n");

    const result = await leaksService.scan({ limit: 5 });
    expect(result.metadata.findings.length).toBeGreaterThan(0);
  });

  it("lists normalized secret scanning alerts", async () => {
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

    vi.mocked(leaksApi.listAlerts).mockResolvedValue([
      {
        number: 3,
        state: "open",
        resolution: null,
        resolved_at: null,
        secret_type: "github_token",
        created_at: "2026-01-01T00:00:00Z",
        secret_type_display_name: "GitHub Token",
        html_url: "https://github.com/owner/repo/security/secret-scanning/3",
      },
    ]);

    const result = await leaksService.alerts({ repos: "owner/repo" });
    const metadata = result.metadata.results[0].metadata;

    expect(metadata).toEqual({
      alerts: [
        {
          number: 3,
          state: "open",
          resolution: null,
          resolvedAt: null,
          repository: "owner/repo",
          secretType: "github_token",
          createdAt: "2026-01-01T00:00:00Z",
          secretTypeDisplayName: "GitHub Token",
          url: "https://github.com/owner/repo/security/secret-scanning/3",
        },
      ],
    });
  });
});
