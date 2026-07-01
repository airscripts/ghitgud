import { describe, it, expect, vi, beforeEach } from "vitest";

import leaks from "@/api/leaks";
import client from "@/providers/github/client";

vi.mock("@/providers/github/client", () => ({
  default: {
    getPaginated: vi.fn(),
    getDefaultPerPage: vi.fn(() => 100),
  },
}));

describe("leaks api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists secret scanning alerts with filters", async () => {
    vi.mocked(client.getPaginated).mockResolvedValue([]);

    await leaks.listAlerts("owner/repo", {
      state: "open",
      secretType: "github_token",
    });

    expect(client.getPaginated).toHaveBeenCalledWith(
      "/repos/owner/repo/secret-scanning/alerts?per_page=100&state=open&secret_type=github_token",
    );
  });
});
