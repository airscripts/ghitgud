import { describe, it, expect, vi, beforeEach } from "vitest";

import complianceService from "@/services/compliance";
import complianceOperations from "@/tui/operations/compliance";

vi.mock("@/services/compliance", () => ({
  default: {
    check: vi.fn(),
  },
}));

describe("tui compliance operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs compliance.check", async () => {
    vi.mocked(complianceService.check).mockResolvedValue({
      success: true,
      metadata: { failed: 0, completed: 0, results: [] },
    });

    const op = complianceOperations.find((o) => o.id === "compliance.check")!;
    await op.run({ values: {} });

    expect(complianceService.check).toHaveBeenCalledWith({
      org: undefined,
      file: undefined,
      repos: undefined,
      limit: undefined,
    });
  });
});
