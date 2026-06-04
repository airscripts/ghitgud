import { describe, it, expect, vi, beforeEach } from "vitest";

import auditApi from "@/api/audit";
import auditService from "@/services/audit";
import { GhitgudError } from "@/core/errors";

vi.mock("@/api/audit", () => ({
  default: {
    list: vi.fn(),
  },
}));

vi.mock("@/core/output", () => ({
  default: {
    renderTable: vi.fn(),
    renderSummary: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    start: vi.fn(),
    success: vi.fn(),
  },
}));

describe("audit service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires an org or enterprise target", async () => {
    await expect(auditService.list({})).rejects.toThrow(GhitgudError);
  });

  it("normalizes audit events", async () => {
    vi.mocked(auditApi.list).mockResolvedValue([
      {
        actor: "octocat",
        _document_id: "1",
        repo: "owner/repo",
        action: "repo.create",
        "@timestamp": 1767225600000,
      },
    ]);

    const result = await auditService.list({ org: "owner" });

    expect(result.metadata.events).toEqual([
      {
        id: "1",
        actor: "octocat",
        repo: "owner/repo",
        action: "repo.create",
        createdAt: "2026-01-01T00:00:00.000Z",

        raw: {
          actor: "octocat",
          _document_id: "1",
          repo: "owner/repo",
          action: "repo.create",
          "@timestamp": 1767225600000,
        },
      },
    ]);
  });
});
