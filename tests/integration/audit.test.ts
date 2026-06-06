import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import auditCommand from "@/commands/audit";

vi.mock("@/services/audit", () => ({
  default: {
    list: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
  },
}));

import auditService from "@/services/audit";

describe("integration > audit command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls auditService.list with parsed options", async () => {
    const program = new Command();
    program.exitOverride();
    auditCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "audit",
      "--org",
      "airscripts",
      "--actor",
      "octocat",
      "--action",
      "repo.create",
      "--limit",
      "50",
      "--order",
      "asc",
    ]);

    expect(auditService.list).toHaveBeenCalledWith({
      org: "airscripts",
      actor: "octocat",
      action: "repo.create",
      limit: "50",
      order: "asc",
    });
  });

  it("calls auditService.list with default order", async () => {
    const program = new Command();
    program.exitOverride();
    auditCommand.register(program);
    await program.parseAsync(["node", "test", "audit", "--org", "airscripts"]);

    expect(auditService.list).toHaveBeenCalledWith(
      expect.objectContaining({ order: "desc" }),
    );
  });
});
