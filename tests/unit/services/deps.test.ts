import { describe, expect, it, vi, beforeEach, Mock } from "vitest";
import depsService from "@/services/deps";

vi.mock("@/api/dependencies", () => ({
  default: { sbom: vi.fn(), compare: vi.fn() },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn() },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn().mockResolvedValue("owner/repo") },
}));

import api from "@/api/dependencies";

describe("deps service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists dependencies", async () => {
    (api.sbom as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          sbom: {
            packages: [
              {
                name: "lodash",
                version: "4.17.21",
                ecosystem: "npm",
                deps: "-",
              },
            ],
          },
        }),
    });
    const result = await depsService.list({ repo: "owner/repo" });
    expect(result.success).toBe(true);
    expect(result.packages).toHaveLength(1);
  });

  it("lists direct dependencies", async () => {
    (api.sbom as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          sbom: {
            packages: [
              {
                name: "lodash",
                version: "4.17.21",
                ecosystem: "npm",
                deps: "-",
              },
            ],
          },
        }),
    });
    const result = await depsService.direct({ repo: "owner/repo" });
    expect(result.success).toBe(true);
    expect(result.packages).toHaveLength(1);
  });

  it("reviews dependencies", async () => {
    (api.compare as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve([
          {
            change_type: "added",
            package: { name: "lodash", ecosystem: "npm", version: "4.17.21" },
            severity: "low",
            vulnerabilities: [],
          },
        ]),
    });
    const result = await depsService.review({
      repo: "owner/repo",
      base: "main",
      head: "feature",
    });
    expect(result.success).toBe(true);
    expect(result.changes).toHaveLength(1);
  });

  it("requires --base for review", async () => {
    await expect(
      depsService.review({ repo: "owner/repo", base: "", head: "feature" }),
    ).rejects.toThrow("--base is required");
  });

  it("requires --head for review", async () => {
    await expect(
      depsService.review({ repo: "owner/repo", base: "main", head: "" }),
    ).rejects.toThrow("--head is required");
  });
});
