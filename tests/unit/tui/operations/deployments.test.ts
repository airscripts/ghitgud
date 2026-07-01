import { describe, it, expect, vi, beforeEach } from "vitest";

import deploymentService from "@/services/deployment";
import deploymentOperations from "@/tui/operations/deployments";

vi.mock("@/services/deployment", () => ({
  default: { list: vi.fn(), view: vi.fn(), create: vi.fn(), status: vi.fn() },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(async () => "owner/repo") },
}));

describe("tui deployment operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs deployment.list", async () => {
    await deploymentOperations[0].run({ values: { limit: 10 } });
    expect(deploymentService.list).toHaveBeenCalledWith({
      repo: "owner/repo",
      environment: undefined,
      limit: 10,
    });
  });

  it("runs deployment.view", async () => {
    await deploymentOperations[1].run({ values: { id: 42 } });
    expect(deploymentService.view).toHaveBeenCalledWith({
      repo: "owner/repo",
      id: 42,
    });
  });

  it("runs deployment.create", async () => {
    await deploymentOperations[2].run({
      values: { ref: "main", environment: "production" },
    });
    expect(deploymentService.create).toHaveBeenCalledWith({
      repo: "owner/repo",
      ref: "main",
      environment: "production",
      description: undefined,
    });
  });

  it("runs deployment.status", async () => {
    await deploymentOperations[3].run({ values: { id: 42 } });
    expect(deploymentService.status).toHaveBeenCalledWith({
      repo: "owner/repo",
      id: 42,
    });
  });
});
