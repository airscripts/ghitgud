import { describe, it, expect, vi, beforeEach } from "vitest";

import config from "@/core/config";
import reposApi from "@/api/repos";
import secretsApi from "@/api/secrets";
import { encryptSecret } from "@/core/secrets";
import secretsService from "@/services/secrets";

vi.mock("@/api/secrets", () => ({
  default: {
    setEnv: vi.fn(),
    setOrg: vi.fn(),
    listOrg: vi.fn(),
    listEnv: vi.fn(),
    setRepo: vi.fn(),
    listRepo: vi.fn(),
    deleteOrg: vi.fn(),
    deleteEnv: vi.fn(),
    deleteRepo: vi.fn(),
    getOrgPublicKey: vi.fn(),
    getEnvPublicKey: vi.fn(),
    getRepoPublicKey: vi.fn(),
  },
}));

vi.mock("@/api/repos", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("@/core/secrets", () => ({
  encryptSecret: vi.fn(() => "encrypted"),
}));

vi.mock("@/core/config", () => ({
  default: { getRepo: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn(), renderSummary: vi.fn(), log: vi.fn() },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

describe("secrets service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(config.getRepo).mockReturnValue("owner/repo");
  });

  const mockResponse = (body: unknown) =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        headers: { "content-type": "application/json" },
      }),
    );

  it("lists repo secrets", async () => {
    vi.mocked(secretsApi.listRepo).mockReturnValue(
      mockResponse({ total_count: 0, secrets: [] }),
    );
    const result = await secretsService.list({});
    expect(result.success).toBe(true);
  });

  it("lists org secrets", async () => {
    vi.mocked(secretsApi.listOrg).mockReturnValue(
      mockResponse({ total_count: 0, secrets: [] }),
    );
    const result = await secretsService.list({ org: "my-org" });
    expect(result.success).toBe(true);
  });

  it("lists environment secrets", async () => {
    vi.mocked(secretsApi.listEnv).mockReturnValue(
      mockResponse({ total_count: 0, secrets: [] }),
    );

    const result = await secretsService.list({ env: "prod" });
    expect(result.success).toBe(true);
  });

  it("sets repo secret", async () => {
    vi.mocked(secretsApi.getRepoPublicKey).mockReturnValue(
      mockResponse({ key_id: "key-1", key: "bXlrZXk=" }),
    );
    vi.mocked(secretsApi.setRepo).mockResolvedValue(new Response("{}"));
    const result = await secretsService.set({ name: "FOO", value: "bar" });
    expect(result.success).toBe(true);
    expect(encryptSecret).toHaveBeenCalled();
  });

  it("sets environment secret", async () => {
    vi.mocked(secretsApi.getEnvPublicKey).mockReturnValue(
      mockResponse({ key_id: "key-2", key: "bXlrZXk=" }),
    );

    vi.mocked(secretsApi.setEnv).mockResolvedValue(new Response("{}"));

    const result = await secretsService.set({
      name: "FOO",
      env: "prod",
      value: "bar",
    });

    expect(result.success).toBe(true);
    expect(secretsApi.setEnv).toHaveBeenCalled();
  });

  it("sets org secret", async () => {
    vi.mocked(secretsApi.getOrgPublicKey).mockReturnValue(
      mockResponse({ key_id: "key-3", key: "bXlrZXk=" }),
    );

    vi.mocked(reposApi.get).mockResolvedValue({
      id: 123,
      name: "a",
      fork: false,
      private: false,
      archived: false,
      pushed_at: null,
      full_name: "owner/a",
      default_branch: "main",
    });

    vi.mocked(secretsApi.setOrg).mockResolvedValue(new Response("{}"));
    const result = await secretsService.set({
      name: "FOO",
      value: "bar",
      org: "my-org",
      visibility: "selected",
      repos: "owner/a,owner/b",
    });

    expect(result.success).toBe(true);
    expect(secretsApi.setOrg).toHaveBeenCalled();
  });

  it("deletes repo secret", async () => {
    vi.mocked(secretsApi.deleteRepo).mockResolvedValue(new Response("{}"));
    const result = await secretsService.remove({ name: "FOO" });
    expect(result.success).toBe(true);
  });

  it("deletes org secret", async () => {
    vi.mocked(secretsApi.deleteOrg).mockResolvedValue(new Response("{}"));
    const result = await secretsService.remove({ name: "FOO", org: "my-org" });
    expect(result.success).toBe(true);
  });

  it("deletes environment secret", async () => {
    vi.mocked(secretsApi.deleteEnv).mockResolvedValue(new Response("{}"));
    const result = await secretsService.remove({
      name: "FOO",
      env: "prod",
    });

    expect(result.success).toBe(true);
  });

  it("throws when name is missing", async () => {
    await expect(
      secretsService.set({ name: "", value: "bar" }),
    ).rejects.toThrow("Secret name is required.");
  });

  it("throws when value is missing", async () => {
    await expect(
      secretsService.set({ name: "FOO", value: "" }),
    ).rejects.toThrow("Secret value is required.");
  });
});
