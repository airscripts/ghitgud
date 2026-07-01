import { describe, it, expect, vi, beforeEach } from "vitest";

import advisoryService from "@/services/advisory";
import advisoryOperations from "@/tui/operations/advisories";

vi.mock("@/services/advisory", () => ({
  default: {
    list: vi.fn(),
    view: vi.fn(),
    create: vi.fn(),
    publish: vi.fn(),
    close: vi.fn(),
    cveRequest: vi.fn(),
  },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(async () => "owner/repo") },
}));

describe("tui advisory operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs advisory.list", async () => {
    await advisoryOperations[0].run({
      values: { repo: "owner/repo", ecosystem: "npm", severity: "high" },
    });
    expect(advisoryService.list).toHaveBeenCalledWith({
      repo: "owner/repo",
      ecosystem: "npm",
      severity: "high",
      state: undefined,
    });
  });

  it("runs advisory.view", async () => {
    await advisoryOperations[1].run({
      values: { ghsaId: "GHSA-abc-123", repo: "owner/repo" },
    });
    expect(advisoryService.view).toHaveBeenCalledWith("GHSA-abc-123", {
      repo: "owner/repo",
    });
  });

  it("runs advisory.create", async () => {
    await advisoryOperations[2].run({
      values: {
        repo: "owner/repo",
        summary: "test",
        description: "desc",
        severity: "high",
        cveId: "CVE-2026-0001",
      },
    });
    expect(advisoryService.create).toHaveBeenCalledWith({
      repo: "owner/repo",
      summary: "test",
      description: "desc",
      severity: "high",
      cveId: "CVE-2026-0001",
    });
  });

  it("runs advisory.publish", async () => {
    await advisoryOperations[3].run({
      values: { ghsaId: "GHSA-abc-123" },
    });
    expect(advisoryService.publish).toHaveBeenCalledWith("GHSA-abc-123", {
      repo: "owner/repo",
    });
  });

  it("runs advisory.close", async () => {
    await advisoryOperations[4].run({
      values: { ghsaId: "GHSA-abc-123" },
    });
    expect(advisoryService.close).toHaveBeenCalledWith("GHSA-abc-123", {
      repo: "owner/repo",
    });
  });

  it("runs advisory.cve-request", async () => {
    await advisoryOperations[5].run({
      values: { ghsaId: "GHSA-abc-123" },
    });
    expect(advisoryService.cveRequest).toHaveBeenCalledWith("GHSA-abc-123", {
      repo: "owner/repo",
    });
  });
});
