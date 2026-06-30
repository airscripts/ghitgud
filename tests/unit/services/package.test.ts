import { describe, expect, it, vi, beforeEach, Mock } from "vitest";
import packageService from "@/services/package";

vi.mock("@/api/packages", () => ({
  default: {
    list: vi.fn(),
    get: vi.fn(),
    versions: vi.fn(),
    deleteVersion: vi.fn(),
    restoreVersion: vi.fn(),
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

vi.mock("@/core/prompt", () => ({
  default: {
    guardNonInteractive: vi.fn(),
    confirm: vi.fn().mockResolvedValue(true),
  },
}));

import api from "@/api/packages";

describe("package service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists packages", async () => {
    (api.list as Mock).mockResolvedValue({
      json: () => Promise.resolve([]),
    });
    const result = await packageService.list({ repo: "owner/repo" });
    expect(result.success).toBe(true);
  });

  it("views a package", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          name: "my-pkg",
          package_type: "npm",
          visibility: "public",
        }),
    });
    const result = await packageService.view("my-pkg", {
      repo: "owner/repo",
      packageType: "npm",
    });
    expect(result.success).toBe(true);
  });

  it("lists package versions", async () => {
    (api.versions as Mock).mockResolvedValue({
      json: () => Promise.resolve([]),
    });
    const result = await packageService.versionsList("my-pkg", {
      repo: "owner/repo",
      packageType: "npm",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid package type", async () => {
    await expect(
      packageService.list({ packageType: "invalid" }),
    ).rejects.toThrow("Invalid package type");
  });
});
