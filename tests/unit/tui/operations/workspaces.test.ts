import { describe, it, expect, vi, beforeEach } from "vitest";

import workspaceService from "@/services/workspace";
import workspaceOperations from "@/tui/operations/workspaces";

vi.mock("@/services/workspace", () => ({
  default: { define: vi.fn(), list: vi.fn() },
}));

describe("tui workspace operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs workspace.define", async () => {
    await workspaceOperations[0].run({
      values: { name: "my-workspace", repos: "owner/a, owner/b" },
    });
    expect(workspaceService.define).toHaveBeenCalledWith("my-workspace", [
      "owner/a",
      "owner/b",
    ]);
  });

  it("runs workspace.list", async () => {
    await workspaceOperations[1].run({ values: {} });
    expect(workspaceService.list).toHaveBeenCalled();
  });
});
