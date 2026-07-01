import codespaces from "@/api/codespaces";
import client from "@/providers/github/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/providers/github/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
    postTokenRequired: vi.fn(),
    deleteTokenRequired: vi.fn(),
  },
}));

describe("codespaces api", () => {
  it("lists codespaces", () => {
    codespaces.list();
    expect(client.getTokenRequired).toHaveBeenCalledWith("/user/codespaces");
  });

  it("gets a codespace", () => {
    codespaces.get("abc123");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/user/codespaces/abc123",
    );
  });

  it("creates a codespace", () => {
    codespaces.create("owner/repo", { ref: "main" });
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/codespaces",
      { ref: "main" },
    );
  });

  it("starts a codespace", () => {
    codespaces.start("abc123");
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/user/codespaces/abc123/start",
      {},
    );
  });

  it("stops a codespace", () => {
    codespaces.stop("abc123");
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/user/codespaces/abc123/stop",
      {},
    );
  });

  it("deletes a codespace", () => {
    codespaces.delete("abc123");
    expect(client.deleteTokenRequired).toHaveBeenCalledWith(
      "/user/codespaces/abc123",
    );
  });
});
