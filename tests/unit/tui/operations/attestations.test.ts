import { describe, it, expect, vi, beforeEach } from "vitest";

import attestationService from "@/services/attestation";
import attestationOperations from "@/tui/operations/attestations";

vi.mock("@/services/attestation", () => ({
  default: { list: vi.fn(), verify: vi.fn() },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(async () => "owner/repo") },
}));

describe("tui attestation operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs attestation.list", async () => {
    await attestationOperations[0].run({
      values: { digest: "sha256:abc", repo: "owner/repo" },
    });
    expect(attestationService.list).toHaveBeenCalledWith("sha256:abc", {
      repo: "owner/repo",
    });
  });

  it("runs attestation.verify", async () => {
    await attestationOperations[1].run({
      values: { digest: "sha256:abc", repo: "owner/repo" },
    });
    expect(attestationService.verify).toHaveBeenCalledWith("sha256:abc", {
      repo: "owner/repo",
    });
  });
});
