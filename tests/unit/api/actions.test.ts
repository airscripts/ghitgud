import actions from "@/api/actions";
import client from "@/api/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
    getDefaultPerPage: vi.fn().mockReturnValue(30),
  },
}));

describe("actions api", () => {
  it("lists runs without status", () => {
    actions.list("owner/repo");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("/repos/owner/repo/actions/runs"),
    );
  });

  it("lists runs with status", () => {
    actions.list("owner/repo", { status: "completed" });
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("status=completed"),
    );
  });
});
