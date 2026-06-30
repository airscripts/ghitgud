import { describe, expect, it, vi, beforeEach, Mock } from "vitest";
import costService from "@/services/cost";

vi.mock("@/api/billing", () => ({
  default: {
    getOrgUsage: vi.fn(),
    getRunTiming: vi.fn(),
    getWorkflowTiming: vi.fn(),
  },
}));

vi.mock("@/api/actions", () => ({
  default: { list: vi.fn() },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: {
    renderTable: vi.fn(),
    renderKeyValues: vi.fn(),
    renderSummary: vi.fn(),
    log: vi.fn(),
    writeValue: vi.fn(),
  },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn().mockResolvedValue("owner/repo") },
}));

import billingApi from "@/api/billing";
import actionsApi from "@/api/actions";

describe("cost service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads usage data", async () => {
    (actionsApi.list as Mock).mockResolvedValue({
      json: () => Promise.resolve({ workflow_runs: [] }),
    });
    const result = await costService.usage({ repo: "owner/repo" });
    expect(result.success).toBe(true);
  });

  it("shows org cost data", async () => {
    (billingApi.getOrgUsage as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          total_minutes_used: 500,
          total_paid_minutes_used: 100,
        }),
    });
    const result = await costService.cost({ org: "myorg" });
    expect(result.success).toBe(true);
  });

  it("shows repo cost data", async () => {
    (actionsApi.list as Mock).mockResolvedValue({
      json: () => Promise.resolve({ workflow_runs: [] }),
    });
    const result = await costService.cost({ repo: "owner/repo" });
    expect(result.success).toBe(true);
  });

  it("shows top spenders", async () => {
    (actionsApi.list as Mock).mockResolvedValue({
      json: () => Promise.resolve({ workflow_runs: [] }),
    });
    const result = await costService.topSpenders({
      repo: "owner/repo",
      limit: 5,
    });
    expect(result.success).toBe(true);
  });

  it("exports as json by default", async () => {
    (actionsApi.list as Mock).mockResolvedValue({
      json: () => Promise.resolve({ workflow_runs: [] }),
    });
    const result = await costService.exportUsage({ repo: "owner/repo" });
    expect(result.success).toBe(true);
  });

  it("exports as csv", async () => {
    (actionsApi.list as Mock).mockResolvedValue({
      json: () => Promise.resolve({ workflow_runs: [] }),
    });
    const result = await costService.exportUsage({
      repo: "owner/repo",
      format: "csv",
    });
    expect(result.success).toBe(true);
  });
});
