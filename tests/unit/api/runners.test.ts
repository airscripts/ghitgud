import runners from "@/api/runners";
import client from "@/providers/github/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/providers/github/client", () => ({
  default: { getTokenRequired: vi.fn(), deleteTokenRequired: vi.fn() },
}));

describe("runners api", () => {
  it("lists runners for a repo", () => {
    runners.list({ repo: "owner/repo" });
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/runners",
    );
  });

  it("lists runners for an org", () => {
    runners.list({ org: "myorg" });
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/orgs/myorg/actions/runners",
    );
  });

  it("lists runners with label filter", () => {
    runners.list({ repo: "owner/repo" }, { label: "linux" });
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("label=linux"),
    );
  });

  it("gets a runner", () => {
    runners.get({ repo: "owner/repo" }, 42);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/runners/42",
    );
  });

  it("removes a runner", () => {
    runners.remove({ repo: "owner/repo" }, 42);
    expect(client.deleteTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/runners/42",
    );
  });

  it("lists runner labels", () => {
    runners.labels({ org: "myorg" }, 42);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/orgs/myorg/actions/runners/42/labels",
    );
  });
});
