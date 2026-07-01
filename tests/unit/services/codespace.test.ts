import { describe, expect, it, vi, beforeEach, Mock } from "vitest";
import codespaceService from "@/services/codespace";

vi.mock("@/api/codespaces", () => ({
  default: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn(), renderKeyValues: vi.fn() },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn().mockResolvedValue("owner/repo") },
}));

import api from "@/api/codespaces";

describe("codespace service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists codespaces", async () => {
    (api.list as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          total_count: 1,
          codespaces: [
            {
              id: 1,
              name: "test-space",
              state: "Available",
              owner: { login: "octocat" },
              repository: { full_name: "owner/repo" },
              git_status: { ref: "main" },
              idle_timeout_minutes: 30,
              machine: { display_name: "2 cores" },
            },
          ],
        }),
    });
    const result = await codespaceService.list();
    expect(result.success).toBe(true);
  });

  it("lists codespaces with nullish defaults", async () => {
    (api.list as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          total_count: 1,
          codespaces: [
            {
              id: 2,
              name: "bare-space",
              state: "Available",
              owner: { login: "octocat" },
              repository: null,
              git_status: null,
              idle_timeout_minutes: null,
              machine: null,
            },
          ],
        }),
    });
    const result = await codespaceService.list();
    expect(result.success).toBe(true);
  });

  it("views a codespace", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          id: 3,
          name: "view-space",
          state: "Available",
          repository: { full_name: "owner/repo" },
          git_status: { ref: "main" },
          idle_timeout_minutes: 30,
          machine: { display_name: "2 cores" },
          created_at: "2026-01-01",
        }),
    });
    const result = await codespaceService.view("view-space");
    expect(result.success).toBe(true);
  });

  it("views a codespace with nullish fields", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          id: 4,
          name: "bare-space",
          state: "Stopped",
          repository: null,
          git_status: null,
          idle_timeout_minutes: null,
          machine: null,
          created_at: null,
        }),
    });
    const result = await codespaceService.view("bare-space");
    expect(result.success).toBe(true);
  });

  it("creates a codespace", async () => {
    (api.create as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          id: 2,
          name: "new-space",
          state: "Creating",
          repository: { full_name: "owner/repo" },
          git_status: { ref: "main" },
        }),
    });
    const result = await codespaceService.create({
      repo: "owner/repo",
      ref: "main",
    });
    expect(result.success).toBe(true);
  });

  it("creates a codespace with all options", async () => {
    (api.create as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          id: 5,
          name: "full-space",
          state: "Creating",
          repository: { full_name: "owner/repo" },
          git_status: { ref: "develop" },
        }),
    });
    const result = await codespaceService.create({
      repo: "owner/repo",
      ref: "develop",
      machine: "standardLinux",
      idleTimeout: 60,
    });
    expect(result.success).toBe(true);
    expect(api.create).toHaveBeenCalledWith("owner/repo", {
      ref: "develop",
      machine: "standardLinux",
      idle_timeout_minutes: 60,
    });
  });

  it("creates a codespace without explicit repo (uses resolver)", async () => {
    (api.create as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          id: 6,
          name: "resolver-space",
          state: "Creating",
          repository: { full_name: "owner/repo" },
          git_status: { ref: "main" },
        }),
    });
    const result = await codespaceService.create({ ref: "main" });
    expect(result.success).toBe(true);
  });

  it("starts a codespace", async () => {
    const result = await codespaceService.start("cs-123");
    expect(result.success).toBe(true);
    expect(api.start).toHaveBeenCalledWith("cs-123");
  });

  it("stops a codespace", async () => {
    const result = await codespaceService.stop("cs-123");
    expect(result.success).toBe(true);
    expect(api.stop).toHaveBeenCalledWith("cs-123");
  });

  it("deletes a codespace with yes flag", async () => {
    const result = await codespaceService.delete("cs-123", { yes: true });
    expect(result.success).toBe(true);
    expect(api.delete).toHaveBeenCalledWith("cs-123");
  });

  it("throws when deleting codespace without yes flag", async () => {
    await expect(codespaceService.delete("cs-123")).rejects.toThrow(
      "Codespace deletion requires --yes.",
    );
  });
});
