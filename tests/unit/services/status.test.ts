import { describe, expect, it, vi } from "vitest";

import api from "@/api/status";
import service from "@/services/status";
import { jsonResponse } from "../helpers/response";

vi.mock("@/api/status", () => ({ default: { search: vi.fn() } }));
vi.mock("@/core/output", () => ({
  default: {
    renderSummary: vi.fn(),
    renderSection: vi.fn(),
    renderTable: vi.fn(),
  },
}));
vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

describe("status service", () => {
  it("aggregates categories and excludes repositories", async () => {
    vi.mocked(api.search).mockImplementation(async () =>
      jsonResponse({
        items: [
          {
            id: 1,
            number: 2,
            title: "Work",
            state: "open",
            html_url: "https://github.com/owner/repo/issues/2",
            repository_url: "https://api.github.com/repos/owner/repo",
            updated_at: "2026-06-30T00:00:00Z",
            user: { login: "alice" },
          },
        ],
      }),
    );
    const result = await service.status({
      org: "acme",
      exclude: ["owner/repo"],
    });
    expect(result.counts.assignedIssues).toBe(0);
    expect(api.search).toHaveBeenCalledTimes(5);
  });

  it("keeps matching work and handles empty search results", async () => {
    vi.mocked(api.search)
      .mockResolvedValueOnce(
        jsonResponse({
          items: [
            {
              id: 1,
              number: 2,
              title: "Work",
              state: "open",
              html_url: "https://github.com/owner/repo/issues/2",
              repository_url: "https://api.github.com/repos/owner/repo",
              updated_at: "2026-06-30T00:00:00Z",
              user: null,
            },
            {
              id: 1,
              number: 2,
              title: "Duplicate",
              state: "open",
              html_url: "https://github.com/owner/repo/issues/2",
              repository_url: "https://api.github.com/repos/owner/repo",
              updated_at: "2026-06-30T00:00:00Z",
              user: null,
            },
          ],
        }),
      )
      .mockImplementation(async () => jsonResponse({}));
    const result = await service.status({});
    expect(result.counts.assignedIssues).toBe(1);
    expect(result.metadata.assignedIssues[0].author).toBeNull();
  });
});
