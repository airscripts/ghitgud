import attestations from "@/api/attestations";
import client from "@/api/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/client", () => ({
  default: { getTokenRequired: vi.fn() },
}));

describe("attestations api", () => {
  it("lists attestations", () => {
    attestations.list("owner/repo", "sha256:abc123");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/attestations/sha256%3Aabc123",
    );
  });

  it("verifies attestations", () => {
    attestations.verify("owner/repo", "sha256:abc123");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/attestations/sha256%3Aabc123",
    );
  });
});
