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

  it("lists deployments with nullish fields", async () => {
    (api.list as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve([
          {
            id: 2,
            ref: null,
            environment: null,
            task: null,
            description: null,
            creator: null,
            created_at: null,
            production_environment: false,
          },
        ]),
    });
    const result = await deploymentService.list({ repo: "owner/repo" });
    expect(result.success).toBe(true);
  });

  it("rejects limit below 1", async () => {
    await expect(
      deploymentService.list({ repo: "owner/repo", limit: 0 }),
    ).rejects.toThrow("Limit must be between 1 and 100");
  });

  it("rejects limit above 100", async () => {
    await expect(
      deploymentService.list({ repo: "owner/repo", limit: 101 }),
    ).rejects.toThrow("Limit must be between 1 and 100");
  });

  it("lists deployments using repo resolver", async () => {
    (api.list as Mock).mockResolvedValue({
      json: () => Promise.resolve([]),
    });
    const result = await deploymentService.list();
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

  it("views a deployment with nullish fields", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          id: 1,
          ref: null,
          environment: null,
          task: null,
          description: null,
          creator: null,
          production_environment: true,
          transient_environment: true,
          created_at: null,
          updated_at: null,
          url: null,
        }),
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

  it("creates a deployment with autoMerge false", async () => {
    (api.create as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({ id: 43, ref: "develop", environment: "dev" }),
    });
    const result = await deploymentService.create({
      repo: "owner/repo",
      ref: "develop",
      environment: "dev",
      description: "test deploy",
      autoMerge: false,
    });
    expect(result.success).toBe(true);
    expect(api.create).toHaveBeenCalledWith("owner/repo", {
      ref: "develop",
      environment: "dev",
      description: "test deploy",
      auto_merge: false,
    });
  });

  it("creates a deployment using repo resolver", async () => {
    (api.create as Mock).mockResolvedValue({
      json: () => Promise.resolve({ id: 44, ref: "main", environment: "prod" }),
    });
    const result = await deploymentService.create({
      ref: "main",
      environment: "prod",
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
