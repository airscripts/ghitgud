import { describe, it, expect, vi, beforeEach } from "vitest";

import client from "@/api/client";
import secrets from "@/api/secrets";

vi.mock("@/api/client", () => ({
  default: {
    getPaginated: vi.fn(),
    getDefaultPerPage: vi.fn(() => 100),
  },
}));

describe("secrets api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists secret scanning alerts with filters", async () => {
    vi.mocked(client.getPaginated).mockResolvedValue([]);

    await secrets.listAlerts("owner/repo", {
      state: "open",
      secretType: "github_token",
    });

    expect(client.getPaginated).toHaveBeenCalledWith(
      "/repos/owner/repo/secret-scanning/alerts?per_page=100&state=open&secret_type=github_token",
    );
  });
});
