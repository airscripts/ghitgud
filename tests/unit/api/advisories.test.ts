import advisories from "@/api/advisories";
import client from "@/providers/github/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/providers/github/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
    postTokenRequired: vi.fn(),
    patchTokenRequired: vi.fn(),
  },
}));

describe("advisories api", () => {
  it("lists advisories without filters", () => {
    advisories.list();
    expect(client.getTokenRequired).toHaveBeenCalledWith("/advisories");
  });

  it("lists advisories with ecosystem filter", () => {
    advisories.list({ ecosystem: "npm" });
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("ecosystem=npm"),
    );
  });

  it("gets an advisory", () => {
    advisories.get("GHSA-xxxx-xxxx-xxxx");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/advisories/GHSA-xxxx-xxxx-xxxx",
    );
  });

  it("lists repo-scoped advisories", () => {
    advisories.listRepo("owner/repo", { state: "published" });
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("/repos/owner/repo/security-advisories"),
    );
  });

  it("gets a repo-scoped advisory", () => {
    advisories.getRepo("owner/repo", "GHSA-xxxx");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining(
        "/repos/owner/repo/security-advisories/GHSA-xxxx",
      ),
    );
  });

  it("creates a repo advisory", () => {
    advisories.create("owner/repo", {
      summary: "Test",
      description: "Desc",
      severity: "high",
    });
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/security-advisories",
      expect.objectContaining({ severity: "high" }),
    );
  });

  it("updates an advisory state", () => {
    advisories.update("owner/repo", "GHSA-xxxx", { state: "published" });
    expect(client.patchTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("/security-advisories/GHSA-xxxx"),
      { state: "published" },
    );
  });

  it("requests a CVE", () => {
    advisories.requestCve("owner/repo", "GHSA-xxxx");
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("/security-advisories/GHSA-xxxx/cve"),
      {},
    );
  });
});
