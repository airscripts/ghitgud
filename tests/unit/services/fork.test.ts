import api from "@/api/forks";
import reposApi from "@/api/repos";
import forkService from "@/services/fork";
import { describe, expect, it, vi, beforeEach, Mock } from "vitest";

vi.mock("@/api/forks", () => ({
  default: { list: vi.fn(), sync: vi.fn(), compare: vi.fn(), create: vi.fn() },
}));

vi.mock("@/api/repos", () => ({
  default: { get: vi.fn() },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn(), renderSummary: vi.fn() },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn().mockResolvedValue("owner/repo") },
}));

describe("fork service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists forks", async () => {
    (api.list as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve([
          {
            id: 1,
            name: "repo",
            full_name: "user/repo",
            owner: { login: "user" },
            default_branch: "main",
            pushed_at: "2026-01-01",
            parent: { full_name: "org/repo" },
          },
        ]),
    });
    const result = await forkService.list({ repo: "org/repo" });
    expect(result.success).toBe(true);
    expect(api.list).toHaveBeenCalledWith("org/repo");
  });

  it("syncs a fork", async () => {
    (reposApi.get as Mock).mockResolvedValue({ default_branch: "main" });
    (api.sync as Mock).mockResolvedValue({ message: "synced", branch: "main" });
    const result = await forkService.sync({ repo: "user/repo" });
    expect(result.success).toBe(true);
    expect(result.branch).toBe("main");
  });

  it("compares a fork", async () => {
    (reposApi.get as Mock).mockResolvedValue({
      default_branch: "main",
      parent: { full_name: "org/repo", default_branch: "main" },
    });
    (api.compare as Mock).mockResolvedValue({
      ahead_by: 2,
      behind_by: 1,
      status: "ahead",
    });
    const result = await forkService.compare({ repo: "user/repo" });
    expect(result.success).toBe(true);
    expect(result.aheadBy).toBe(2);
  });

  it("creates a fork", async () => {
    (api.create as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          id: 42,
          full_name: "user/repo",
          html_url: "https://github.com/user/repo",
        }),
    });
    const result = await forkService.create({ repo: "org/repo" });
    expect(result.success).toBe(true);
    expect(api.create).toHaveBeenCalledWith("org/repo", {});
  });
});
