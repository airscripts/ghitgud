import billing from "@/api/billing";
import client from "@/providers/github/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/providers/github/client", () => ({
  default: { getTokenRequired: vi.fn() },
}));

describe("billing api", () => {
  it("gets org usage", () => {
    billing.getOrgUsage("myorg");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/orgs/myorg/settings/billing/actions",
    );
  });

  it("gets run timing", () => {
    billing.getRunTiming("owner/repo", 123);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/runs/123/timing",
    );
  });

  it("gets workflow timing", () => {
    billing.getWorkflowTiming("owner/repo", 456);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/workflows/456/timing",
    );
  });
});
