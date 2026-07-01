import { describe, it, expect, vi, beforeEach } from "vitest";

import audit from "@/api/audit";
import client from "@/providers/github/client";

vi.mock("@/providers/github/client", () => ({
  default: {
    getPaginated: vi.fn(),
    getDefaultPerPage: vi.fn(() => 100),
  },
}));

describe("audit api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds org audit query", async () => {
    vi.mocked(client.getPaginated).mockResolvedValue([]);

    await audit.list({
      order: "desc",
      actor: "octocat",
      org: "airscripts",
      action: "repo.create",
      repo: "airscripts/gitfleet",
    });

    expect(client.getPaginated).toHaveBeenCalledWith(
      "/orgs/airscripts/audit-log?per_page=100&phrase=actor%3Aoctocat+action%3Arepo.create+repo%3Aairscripts%2Fgitfleet&order=desc",
    );
  });

  it("builds enterprise audit query", async () => {
    vi.mocked(client.getPaginated).mockResolvedValue([]);
    await audit.list({ enterprise: "acme", after: "2026-01-01" });

    expect(client.getPaginated).toHaveBeenCalledWith(
      "/enterprises/acme/audit-log?per_page=100&after=2026-01-01",
    );
  });
});
