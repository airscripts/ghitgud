import { describe, it, expect, vi, beforeEach } from "vitest";

import leaksService from "@/services/leaks";
import leaksOperations from "@/tui/operations/security-leaks";

vi.mock("@/services/leaks", () => ({
  default: {
    scan: vi.fn(),
    alerts: vi.fn(),
  },
}));

describe("tui leaks operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs leaks.scan", async () => {
    vi.mocked(leaksService.scan).mockResolvedValue({
      success: true,
      metadata: { findings: [] },
    });

    const op = leaksOperations.find((o) => o.id === "leaks.scan")!;
    await op.run({ values: {} });
    expect(leaksService.scan).toHaveBeenCalledWith({ limit: undefined });
  });

  it("runs leaks.alerts", async () => {
    vi.mocked(leaksService.alerts).mockResolvedValue({
      success: true,
      metadata: { failed: 0, completed: 0, results: [] },
    });

    const op = leaksOperations.find((o) => o.id === "leaks.alerts")!;
    await op.run({ values: {} });

    expect(leaksService.alerts).toHaveBeenCalledWith({
      org: undefined,
      file: undefined,
      repos: undefined,
      limit: undefined,
      state: undefined,
      after: undefined,
      before: undefined,
      resolution: undefined,
      secretType: undefined,
    });
  });
});
