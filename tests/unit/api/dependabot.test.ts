import { describe, it, expect, vi, beforeEach } from "vitest";

import client from "@/providers/github/client";
import dependabot from "@/api/dependabot";

vi.mock("@/providers/github/client", () => ({
  default: {
    getPaginated: vi.fn(),
    patchTokenRequired: vi.fn(),
    getDefaultPerPage: vi.fn(() => 100),
  },
}));

describe("dependabot api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists dependabot alerts with filters", async () => {
    vi.mocked(client.getPaginated).mockResolvedValue([]);

    await dependabot.listAlerts("owner/repo", {
      state: "open",
      severity: "high",
      ecosystem: "npm",
    });

    expect(client.getPaginated).toHaveBeenCalledWith(
      "/repos/owner/repo/dependabot/alerts?per_page=100&state=open&severity=high&ecosystem=npm",
    );
  });

  it("dismisses an alert", async () => {
    vi.mocked(client.patchTokenRequired).mockResolvedValue({} as Response);

    await dependabot.dismissAlert("owner/repo", 12, {
      comment: "accepted",
      reason: "tolerable_risk",
    });

    expect(client.patchTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/dependabot/alerts/12",
      {
        state: "dismissed",
        dismissed_comment: "accepted",
        dismissed_reason: "tolerable_risk",
      },
    );
  });
});
