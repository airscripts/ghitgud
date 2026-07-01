import protection from "@/api/protection";
import client from "@/providers/github/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/providers/github/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
    putTokenRequired: vi.fn(),
    deleteTokenRequired: vi.fn(),
    postTokenRequired: vi.fn(),
    getPaginated: vi.fn(),
    getDefaultPerPage: vi.fn().mockReturnValue(100),
  },
}));

describe("protection api", () => {
  it("gets branch protection", () => {
    protection.getBranchProtection("owner/repo", "main");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/branches/main/protection",
    );
  });

  it("protects a branch", () => {
    protection.protect("owner/repo", "main", {
      enforce_admins: true,
      restrictions: null,
      allow_force_pushes: false,
    });
    expect(client.putTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/branches/main/protection",
      {
        enforce_admins: true,
        restrictions: null,
        allow_force_pushes: false,
      },
    );
  });

  it("unprotects a branch", () => {
    protection.unprotect("owner/repo", "main");
    expect(client.deleteTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/branches/main/protection",
    );
  });

  it("lists tag protection", () => {
    protection.listTagProtection("owner/repo");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/tags-protection",
    );
  });

  it("creates tag protection", () => {
    protection.createTagProtection("owner/repo", "v*");
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/tags-protection",
      { pattern: "v*" },
    );
  });

  it("deletes tag protection", () => {
    protection.deleteTagProtection("owner/repo", 1);
    expect(client.deleteTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/tags-protection/1",
    );
  });
});
