import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import complianceCommand from "@/commands/compliance";

vi.mock("@/services/compliance", () => ({
  default: {
    check: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

import complianceService from "@/services/compliance";

describe("integration > compliance commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("check calls service with target options", async () => {
    const program = new Command();
    program.exitOverride();
    complianceCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "compliance",
      "check",
      "--org",
      "airscripts",
      "--limit",
      "20",
    ]);

    expect(complianceService.check).toHaveBeenCalledWith({
      org: "airscripts",
      limit: "20",
    });
  });
});
