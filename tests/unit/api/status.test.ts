import { describe, expect, it, vi } from "vitest";

import client from "@/providers/github/client";
import status from "@/api/status";

vi.mock("@/providers/github/client", () => ({
  default: { getTokenRequired: vi.fn() },
}));

describe("status api", () => {
  it("builds global and organization search queries", async () => {
    await status.search("assignedIssues");
    await status.search("authoredPullRequests", "acme", 10);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("assignee%3A%40me"),
    );
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("org%3Aacme"),
    );
  });
});
