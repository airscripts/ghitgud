import packages from "@/api/packages";
import client from "@/api/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
    deleteTokenRequired: vi.fn(),
    postTokenRequired: vi.fn(),
  },
}));

describe("packages api", () => {
  it("lists packages for a repo", () => {
    packages.list({ repo: "owner/repo" });
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("/repos/owner/repo/packages"),
    );
  });

  it("lists packages for an org", () => {
    packages.list({ org: "myorg" });
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("/orgs/myorg/packages"),
    );
  });

  it("lists packages with type filter", () => {
    packages.list({ repo: "owner/repo", packageType: "docker" });
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("package_type=docker"),
    );
  });

  it("gets a package", () => {
    packages.get({
      repo: "owner/repo",
      packageType: "npm",
      packageName: "my-pkg",
    });
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("/repos/owner/repo/packages/npm/my-pkg"),
    );
  });

  it("lists versions", () => {
    packages.versions({
      repo: "owner/repo",
      packageType: "npm",
      packageName: "my-pkg",
    });
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("/versions"),
    );
  });

  it("deletes a version", () => {
    packages.deleteVersion({
      repo: "owner/repo",
      packageType: "npm",
      packageName: "my-pkg",
      versionId: 123,
    });
    expect(client.deleteTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("/versions/123"),
    );
  });

  it("restores a version", () => {
    packages.restoreVersion({
      repo: "owner/repo",
      packageType: "npm",
      packageName: "my-pkg",
      versionId: 123,
    });
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("/versions/123/restore"),
      {},
    );
  });
});
