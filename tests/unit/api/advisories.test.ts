import advisories from "@/api/advisories";
import client from "@/api/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/client", () => ({
  default: { getTokenRequired: vi.fn() },
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
});
