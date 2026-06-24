import { describe, it, expect, vi, beforeEach } from "vitest";

import environmentsApi from "@/api/environments";
import environmentsService from "@/services/environments";

vi.mock("@/api/environments", () => ({
  default: {
    list: vi.fn(),
    create: vi.fn(),
    addProtectionRule: vi.fn(),
    listProtectionRules: vi.fn(),
    removeProtectionRule: vi.fn(),
  },
}));

vi.mock("@/core/repo", () => ({
  default: {
    resolveRepoSync: vi.fn(() => "owner/repo"),
    resolveRepo: vi.fn(() => Promise.resolve("owner/repo")),
  },
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn(), renderSummary: vi.fn(), log: vi.fn() },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

describe("environments service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockResponse = (body: unknown) =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        headers: { "content-type": "application/json" },
      }),
    );

  it("lists environments", async () => {
    vi.mocked(environmentsApi.list).mockReturnValue(
      mockResponse({
        total_count: 1,

        environments: [
          {
            id: 1,
            name: "prod",
            wait_timer: null,
            protection_rules: [],
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-02T00:00:00Z",
            html_url: "https://github.com/owner/repo/deployments/prod",
            url: "https://api.github.com/repos/owner/repo/environments/prod",
          },
        ],
      }),
    );

    const result = await environmentsService.list("owner/repo");
    expect(result.success).toBe(true);
    expect(result.environments.length).toBe(1);
  });

  it("creates environment", async () => {
    vi.mocked(environmentsApi.create).mockResolvedValue(new Response("{}"));

    const result = await environmentsService.create("owner/repo", {
      name: "staging",
    });

    expect(result.success).toBe(true);
    expect(environmentsApi.create).toHaveBeenCalledWith(
      "owner",
      "repo",
      "staging",
      undefined,
    );
  });

  it("lists protection rules", async () => {
    vi.mocked(environmentsApi.listProtectionRules).mockReturnValue(
      mockResponse([
        {
          id: 1,
          wait_timer: 30,
          reviewers: null,
          type: "wait_timer",
          branch_policy: null,
        },
      ]),
    );

    const result = await environmentsService.listProtectionRules(
      "owner/repo",
      "prod",
    );

    expect(result.success).toBe(true);
    expect(result.rules.length).toBe(1);
  });

  it("removes protection rule", async () => {
    vi.mocked(environmentsApi.removeProtectionRule).mockResolvedValue(
      new Response("{}"),
    );

    const result = await environmentsService.removeProtectionRule(
      "owner/repo",
      {
        ruleId: 1,
        env: "prod",
      },
    );

    expect(result.success).toBe(true);
  });
});
