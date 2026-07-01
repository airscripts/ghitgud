import { describe, it, expect, vi, beforeEach } from "vitest";

import packageService from "@/services/package";
import packageOperations from "@/tui/operations/registries";

vi.mock("@/services/package", () => ({
  default: {
    list: vi.fn(),
    view: vi.fn(),
    versionsList: vi.fn(),
    deleteVersion: vi.fn(),
    restoreVersion: vi.fn(),
  },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(async () => "owner/repo") },
}));

describe("tui package operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs package.list", async () => {
    await packageOperations[0].run({
      values: { org: "my-org", type: "npm" },
    });
    expect(packageService.list).toHaveBeenCalledWith({
      repo: undefined,
      org: "my-org",
      packageType: "npm",
    });
  });

  it("runs package.view", async () => {
    await packageOperations[1].run({
      values: { name: "my-pkg", type: "npm" },
    });
    expect(packageService.view).toHaveBeenCalledWith("my-pkg", {
      repo: "owner/repo",
      packageType: "npm",
    });
  });

  it("runs package.versions", async () => {
    await packageOperations[2].run({
      values: { name: "my-pkg", type: "npm" },
    });
    expect(packageService.versionsList).toHaveBeenCalledWith("my-pkg", {
      repo: "owner/repo",
      packageType: "npm",
    });
  });

  it("runs package.delete", async () => {
    await packageOperations[3].run({
      values: { name: "my-pkg", versionId: 10, type: "npm" },
    });
    expect(packageService.deleteVersion).toHaveBeenCalledWith("my-pkg", 10, {
      repo: "owner/repo",
      packageType: "npm",
      yes: true,
    });
  });

  it("runs package.restore", async () => {
    await packageOperations[4].run({
      values: { name: "my-pkg", versionId: 10, type: "npm" },
    });
    expect(packageService.restoreVersion).toHaveBeenCalledWith("my-pkg", 10, {
      repo: "owner/repo",
      packageType: "npm",
    });
  });
});
