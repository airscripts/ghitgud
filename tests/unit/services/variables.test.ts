import { describe, it, expect, vi, beforeEach } from "vitest";

import variablesApi from "@/api/variables";
import variablesService from "@/services/variables";

vi.mock("@/api/variables", () => ({
  default: {
    setEnv: vi.fn(),
    setOrg: vi.fn(),
    listOrg: vi.fn(),
    listEnv: vi.fn(),
    setRepo: vi.fn(),
    listRepo: vi.fn(),
    updateEnv: vi.fn(),
    deleteEnv: vi.fn(),
    deleteOrg: vi.fn(),
    updateOrg: vi.fn(),
    updateRepo: vi.fn(),
    deleteRepo: vi.fn(),
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

describe("variables service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockResponse = (body: unknown) =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        headers: { "content-type": "application/json" },
      }),
    );

  it("lists repo variables", async () => {
    vi.mocked(variablesApi.listRepo).mockReturnValue(
      mockResponse({
        total_count: 1,

        variables: [
          {
            name: "FOO",
            value: "bar",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-02T00:00:00Z",
          },
        ],
      }),
    );

    const result = await variablesService.list({ repo: "owner/repo" });
    expect(result.success).toBe(true);
    expect(result.variables.length).toBe(1);
    expect(variablesApi.listRepo).toHaveBeenCalledWith("owner", "repo");
  });

  it("lists org variables", async () => {
    vi.mocked(variablesApi.listOrg).mockReturnValue(
      mockResponse({
        variables: [],
        total_count: 0,
        visibility: "all",
      }),
    );

    const result = await variablesService.list({
      repo: "owner/repo",
      org: "my-org",
    });

    expect(result.success).toBe(true);
    expect(variablesApi.listOrg).toHaveBeenCalledWith("my-org");
  });

  it("lists environment variables", async () => {
    vi.mocked(variablesApi.listEnv).mockReturnValue(
      mockResponse({ total_count: 0, variables: [] }),
    );

    const result = await variablesService.list({
      repo: "owner/repo",
      env: "prod",
    });

    expect(result.success).toBe(true);
    expect(variablesApi.listEnv).toHaveBeenCalledWith("owner", "repo", "prod");
  });

  it("sets repo variable via update", async () => {
    vi.mocked(variablesApi.updateRepo).mockResolvedValue(new Response("{}"));
    vi.mocked(variablesApi.setRepo).mockResolvedValue(new Response("{}"));

    const result = await variablesService.set({
      repo: "owner/repo",
      name: "FOO",
      value: "bar",
    });

    expect(result.success).toBe(true);
  });

  it("sets environment variable", async () => {
    vi.mocked(variablesApi.updateEnv).mockResolvedValue(new Response("{}"));
    vi.mocked(variablesApi.setEnv).mockResolvedValue(new Response("{}"));

    const result = await variablesService.set({
      repo: "owner/repo",
      name: "FOO",
      env: "prod",
      value: "bar",
    });

    expect(result.success).toBe(true);
  });

  it("sets org variable via update", async () => {
    vi.mocked(variablesApi.updateOrg).mockResolvedValue(new Response("{}"));
    vi.mocked(variablesApi.setOrg).mockResolvedValue(new Response("{}"));

    const result = await variablesService.set({
      name: "FOO",
      value: "bar",
      org: "my-org",
    });

    expect(result.success).toBe(true);
    expect(variablesApi.updateOrg).toHaveBeenCalledWith("my-org", "FOO", "bar");
  });

  it("deletes repo variable", async () => {
    vi.mocked(variablesApi.deleteRepo).mockResolvedValue(new Response("{}"));
    const result = await variablesService.remove({
      repo: "owner/repo",
      name: "FOO",
    });

    expect(result.success).toBe(true);
  });

  it("deletes org variable", async () => {
    vi.mocked(variablesApi.deleteOrg).mockResolvedValue(new Response("{}"));
    const result = await variablesService.remove({
      name: "FOO",
      org: "my-org",
    });

    expect(result.success).toBe(true);
    expect(variablesApi.deleteOrg).toHaveBeenCalledWith("my-org", "FOO");
  });

  it("deletes environment variable", async () => {
    vi.mocked(variablesApi.deleteEnv).mockResolvedValue(new Response("{}"));

    const result = await variablesService.remove({
      repo: "owner/repo",
      name: "FOO",
      env: "prod",
    });

    expect(result.success).toBe(true);
  });

  it("throws when name is missing for set", async () => {
    await expect(
      variablesService.set({ repo: "owner/repo", name: "", value: "bar" }),
    ).rejects.toThrow("Variable name is required.");
  });

  it("throws when value is missing for set", async () => {
    await expect(
      variablesService.set({ repo: "owner/repo", name: "FOO", value: "" }),
    ).rejects.toThrow("Variable value is required.");
  });

  it("throws when name is missing for delete", async () => {
    await expect(
      variablesService.remove({ repo: "owner/repo", name: "" }),
    ).rejects.toThrow("Variable name is required.");
  });
});
