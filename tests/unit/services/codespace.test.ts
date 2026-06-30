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
});
