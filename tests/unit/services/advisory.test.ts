import { describe, expect, it, vi, beforeEach, Mock } from "vitest";
import advisoryService from "@/services/advisory";

vi.mock("@/api/advisories", () => ({
  default: { list: vi.fn(), get: vi.fn() },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn(), renderKeyValues: vi.fn() },
}));

import api from "@/api/advisories";

describe("advisory service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists advisories", async () => {
    (api.list as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve([
          {
            ghsa_id: "GHSA-xxxx",
            severity: "high",
            ecosystem: "npm",
            summary: "Test",
            cve_id: "CVE-2026-0001",
            published_at: "2026-01-01",
            html_url: "https://github.com",
          },
        ]),
    });
    const result = await advisoryService.list();
    expect(result.success).toBe(true);
    expect(result.advisories).toHaveLength(1);
  });

  it("lists advisories with filters", async () => {
    (api.list as Mock).mockResolvedValue({
      json: () => Promise.resolve([]),
    });
    const result = await advisoryService.list({
      ecosystem: "npm",
      severity: "high",
    });
    expect(result.success).toBe(true);
  });

  it("views an advisory", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          ghsa_id: "GHSA-xxxx",
          summary: "Test advisory",
          severity: "high",
          cve_id: "CVE-2026-0001",
          ecosystem: "npm",
          published_at: "2026-01-01",
          html_url: "https://github.com",
        }),
    });
    const result = await advisoryService.view("GHSA-xxxx");
    expect(result.success).toBe(true);
  });
});
