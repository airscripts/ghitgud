import { describe, it, expect, vi, beforeEach } from "vitest";

import auditApi from "@/api/audit";
import auditService from "@/services/audit";
import { GitfleetError } from "@/core/errors";

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
    await expect(auditService.list({})).rejects.toThrow(GitfleetError);
  });

  it("rejects an invalid limit", async () => {
    await expect(
      auditService.list({ org: "owner", limit: "abc" }),
    ).rejects.toThrow(GitfleetError);
  });

  it("normalizes audit events with numeric timestamps", async () => {
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

  it("normalizes audit events with string timestamps", async () => {
    vi.mocked(auditApi.list).mockResolvedValue([
      {
        _document_id: "2",
        action: "repo.delete",
        "@timestamp": "2026-02-01T00:00:00Z",
      },
    ]);

    const result = await auditService.list({ org: "owner", limit: "5" });
    expect(result.metadata.events[0].createdAt).toBe("2026-02-01T00:00:00Z");
  });

  it("normalizes audit events with missing fields", async () => {
    vi.mocked(auditApi.list).mockResolvedValue([
      {
        actor_login: "admin",
        repository: "owner/repo2",
      },
    ]);

    const result = await auditService.list({ enterprise: "acme" });
    const event = result.metadata.events[0];

    expect(event.id).toBe("");
    expect(event.action).toBe("unknown");
    expect(event.createdAt).toBeNull();
  });
});
