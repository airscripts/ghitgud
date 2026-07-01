import { describe, it, expect, vi, beforeEach } from "vitest";

import auditService from "@/services/audit";
import auditOperations from "@/tui/operations/security-audit";

vi.mock("@/services/audit", () => ({
  default: {
    list: vi.fn(),
  },
}));

describe("tui audit operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs audit.list", async () => {
    vi.mocked(auditService.list).mockResolvedValue({
      success: true,
      metadata: { events: [] },
    });

    const op = auditOperations.find((o) => o.id === "audit.list")!;
    await op.run({ values: { org: "my-org" } });

    expect(auditService.list).toHaveBeenCalledWith(
      expect.objectContaining({
        org: "my-org",
        repo: undefined,
        actor: undefined,
        after: undefined,
        limit: undefined,
        order: undefined,
        action: undefined,
        before: undefined,
        enterprise: undefined,
      }),
    );
  });
});
