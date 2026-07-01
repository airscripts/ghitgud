import deployments from "@/api/deployments";
import client from "@/providers/github/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/providers/github/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
    postTokenRequired: vi.fn(),
  },
}));

describe("deployments api", () => {
  it("lists deployments", () => {
    deployments.list("owner/repo");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("/repos/owner/repo/deployments"),
    );
  });

  it("lists deployments with environment filter", () => {
    deployments.list("owner/repo", { environment: "production", limit: 10 });
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("environment=production"),
    );
  });

  it("gets a deployment", () => {
    deployments.get("owner/repo", 1);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/deployments/1",
    );
  });

  it("creates a deployment", () => {
    deployments.create("owner/repo", {
      ref: "main",
      environment: "staging",
      auto_merge: true,
    });
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/deployments",
      {
        ref: "main",
        environment: "staging",
        auto_merge: true,
      },
    );
  });

  it("lists deployment statuses", () => {
    deployments.statuses("owner/repo", 1);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/deployments/1/statuses",
    );
  });

  it("creates a deployment status", () => {
    deployments.createStatus("owner/repo", 1, { state: "success" });
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/deployments/1/statuses",
      {
        state: "success",
      },
    );
  });
});
