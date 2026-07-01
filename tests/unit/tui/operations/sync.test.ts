import { describe, it, expect, vi, beforeEach } from "vitest";

import syncService from "@/services/sync";
import syncOperations from "@/tui/operations/sync";

vi.mock("@/services/sync", () => ({
  default: { syncall: vi.fn(), statusall: vi.fn() },
}));

describe("tui sync operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs repo.syncall", async () => {
    await syncOperations[0].run({ values: { root: "/home/user/repos" } });
    expect(syncService.syncall).toHaveBeenCalledWith({
      root: "/home/user/repos",
    });
  });

  it("runs repo.statusall", async () => {
    await syncOperations[1].run({ values: { root: "/home/user/repos" } });
    expect(syncService.statusall).toHaveBeenCalledWith({
      root: "/home/user/repos",
    });
  });
});
