import api from "@/api/deployments";
import deploymentService from "@/services/deployment";
import { describe, expect, it, vi, beforeEach, Mock } from "vitest";

vi.mock("@/api/deployments", () => ({
  default: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    statuses: vi.fn(),
    createStatus: vi.fn(),
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

describe("deployment service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists deployments", async () => {
    (api.list as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve([
          {
            id: 1,
            ref: "main",
            environment: "production",
            created_at: "2026-01-01",
          },
        ]),
    });
    const result = await deploymentService.list({ repo: "owner/repo" });
    expect(result.success).toBe(true);
  });

  it("views a deployment", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({ id: 1, ref: "main", environment: "production" }),
    });
    const result = await deploymentService.view({ repo: "owner/repo", id: 1 });
    expect(result.success).toBe(true);
  });

  it("creates a deployment", async () => {
    (api.create as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({ id: 42, ref: "main", environment: "staging" }),
    });
    const result = await deploymentService.create({
      repo: "owner/repo",
      ref: "main",
      environment: "staging",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid deployment state", async () => {
    await expect(
      deploymentService.createStatus({
        repo: "owner/repo",
        id: 1,
        state: "invalid",
      }),
    ).rejects.toThrow("Invalid state");
  });

  it("creates a deployment status", async () => {
    (api.createStatus as Mock).mockResolvedValue({
      json: () => Promise.resolve({ id: 1, state: "success" }),
    });
    const result = await deploymentService.createStatus({
      repo: "owner/repo",
      id: 1,
      state: "success",
    });
    expect(result.success).toBe(true);
  });

  it("lists deployment statuses", async () => {
    (api.statuses as Mock).mockResolvedValue({
      json: () => Promise.resolve([{ id: 1, state: "success" }]),
    });
    const result = await deploymentService.status({
      repo: "owner/repo",
      id: 1,
    });
    expect(result.success).toBe(true);
  });
});
