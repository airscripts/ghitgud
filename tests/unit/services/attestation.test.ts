import { describe, expect, it, vi, beforeEach, Mock } from "vitest";
import attestationService from "@/services/attestation";

vi.mock("@/api/attestations", () => ({
  default: { list: vi.fn(), verify: vi.fn() },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn(), renderKeyValues: vi.fn() },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn().mockResolvedValue("owner/repo") },
}));

import api from "@/api/attestations";

describe("attestation service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists attestations", async () => {
    (api.list as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          attestations: [
            {
              bundle_type: "sigstore",
              predicate_type: "slsaprovenance",
              subject_digest: { sha256: "abc123" },
              repository_id: 1,
              created_at: "2026-01-01",
            },
          ],
        }),
    });
    const result = await attestationService.list("sha256:abc123", {
      repo: "owner/repo",
    });
    expect(result.success).toBe(true);
  });

  it("verifies attestations", async () => {
    (api.verify as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          attestations: [
            {
              bundle_type: "sigstore",
              predicate_type: "slsaprovenance",
              created_at: "2026-01-01",
            },
          ],
        }),
    });
    const result = await attestationService.verify("sha256:abc123", {
      repo: "owner/repo",
    });
    expect(result.success).toBe(true);
  });
});
