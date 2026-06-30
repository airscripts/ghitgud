import { describe, expect, it, vi, beforeEach, Mock } from "vitest";
import advisoryService from "@/services/advisory";

vi.mock("@/api/advisories", () => ({
  default: {
    list: vi.fn(),
    get: vi.fn(),
    listRepo: vi.fn(),
    getRepo: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    requestCve: vi.fn(),
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

import api from "@/api/advisories";

describe("advisory service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists global advisories", async () => {
    (api.list as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve([
          {
            ghsaId: "GHSA-xxxx",
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

  it("lists repo-scoped advisories", async () => {
    (api.listRepo as Mock).mockResolvedValue({
      json: () => Promise.resolve([]),
    });
    const result = await advisoryService.list({
      repo: "owner/repo",
      state: "published",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid state", async () => {
    await expect(advisoryService.list({ state: "invalid" })).rejects.toThrow(
      "Invalid state",
    );
  });

  it("rejects invalid severity", async () => {
    await expect(advisoryService.list({ severity: "invalid" })).rejects.toThrow(
      "Invalid severity",
    );
  });

  it("views a global advisory", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          ghsaId: "GHSA-xxxx",
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

  it("views a repo-scoped advisory", async () => {
    (api.getRepo as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          ghsaId: "GHSA-xxxx",
          summary: "Test",
          severity: "high",
          state: "published",
        }),
    });
    const result = await advisoryService.view("GHSA-xxxx", {
      repo: "owner/repo",
    });
    expect(result.success).toBe(true);
  });

  it("creates a repo advisory", async () => {
    (api.create as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          ghsaId: "GHSA-new",
          summary: "Test",
          severity: "high",
          state: "draft",
        }),
    });
    const result = await advisoryService.create({
      repo: "owner/repo",
      summary: "Test",
      description: "Description",
      severity: "high",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid severity on create", async () => {
    await expect(
      advisoryService.create({
        repo: "owner/repo",
        summary: "Test",
        description: "Desc",
        severity: "invalid",
      }),
    ).rejects.toThrow("Invalid severity");
  });

  it("publishes an advisory", async () => {
    (api.update as Mock).mockResolvedValue({
      json: () => Promise.resolve({ ghsaId: "GHSA-xxxx", state: "published" }),
    });
    const result = await advisoryService.publish("GHSA-xxxx", {
      repo: "owner/repo",
    });
    expect(result.success).toBe(true);
  });

  it("closes an advisory", async () => {
    (api.update as Mock).mockResolvedValue({
      json: () => Promise.resolve({ ghsaId: "GHSA-xxxx", state: "closed" }),
    });
    const result = await advisoryService.close("GHSA-xxxx", {
      repo: "owner/repo",
    });
    expect(result.success).toBe(true);
  });

  it("requests a CVE", async () => {
    (api.requestCve as Mock).mockResolvedValue({ ok: true });
    const result = await advisoryService.cveRequest("GHSA-xxxx", {
      repo: "owner/repo",
    });
    expect(result.success).toBe(true);
  });
});
