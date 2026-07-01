import codeql from "@/api/codeql";
import client from "@/providers/github/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/providers/github/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
    patchTokenRequired: vi.fn(),
    getDefaultPerPage: vi.fn().mockReturnValue(30),
  },
}));

describe("codeql api", () => {
  it("lists alerts", () => {
    codeql.list("owner/repo");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("/repos/owner/repo/code-scanning/alerts"),
    );
  });

  it("lists alerts with filters", () => {
    codeql.list("owner/repo", { state: "open", severity: "high" });
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("state=open"),
    );
  });

  it("gets an alert", () => {
    codeql.get("owner/repo", 1);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/code-scanning/alerts/1",
    );
  });

  it("dismisses an alert", () => {
    codeql.update("owner/repo", 1, {
      state: "dismissed",
      dismissed_reason: "false positive",
    });
    expect(client.patchTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/code-scanning/alerts/1",
      {
        state: "dismissed",
        dismissed_reason: "false positive",
      },
    );
  });
});
