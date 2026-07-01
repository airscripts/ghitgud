import { describe, expect, it, vi, beforeEach, Mock } from "vitest";
import codeService from "@/services/code";

vi.mock("@/api/code", () => ({
  default: {
    search: vi.fn(),
    definitions: vi.fn(),
    references: vi.fn(),
    fileContents: vi.fn(),
    blameCommits: vi.fn(),
    commitPRs: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: {
    renderTable: vi.fn(),
    renderSummary: vi.fn(),
    renderKeyValues: vi.fn(),
    writeValue: vi.fn(),
  },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn().mockResolvedValue("owner/repo") },
}));

import api from "@/api/code";

describe("code service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("searches code", async () => {
    (api.search as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          total_count: 1,
          incomplete_results: false,
          items: [
            {
              name: "index.ts",
              path: "src/index.ts",
              repository: { full_name: "owner/repo" },
              html_url: "https://github.com/owner/repo/blob/main/src/index.ts",
            },
          ],
        }),
    });
    const result = await codeService.search("test", { repo: "owner/repo" });
    expect(result.success).toBe(true);
  });

  it("finds definitions", async () => {
    (api.definitions as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          total_count: 0,
          incomplete_results: false,
          items: [],
        }),
    });
    const result = await codeService.definitions("main");
    expect(result.success).toBe(true);
  });

  it("finds references", async () => {
    (api.references as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          total_count: 0,
          incomplete_results: false,
          items: [],
        }),
    });
    const result = await codeService.references("import");
    expect(result.success).toBe(true);
  });

  it("views a file", async () => {
    (api.fileContents as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          content: Buffer.from("hello").toString("base64"),
          path: "test.txt",
          type: "file",
          size: 5,
        }),
    });
    const result = await codeService.file("test.txt", { repo: "owner/repo" });
    expect(result.success).toBe(true);
  });

  it("blames a file with no PRs", async () => {
    (api.blameCommits as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve([
          {
            sha: "abc123def456",
            commit: { author: { date: "2026-01-01" }, message: "test" },
            author: { login: "octocat" },
            html_url: "https://github.com/owner/repo/commit/abc123def456",
          },
        ]),
    });
    (api.commitPRs as Mock).mockRejectedValue(new Error("No PRs"));
    const result = await codeService.blame("src/index.ts", {
      repo: "owner/repo",
    });
    expect(result.success).toBe(true);
  });
});
