import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import dependabotCommand from "@/commands/security-dependabot";

vi.mock("@/services/dependabot", () => ({
  default: {
    list: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
    dismiss: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

import dependabotService from "@/services/dependabot";

describe("integration > dependabot commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list calls service with filter options", async () => {
    const program = new Command();
    program.exitOverride();
    dependabotCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "security",
      "dependabot",
      "list",
      "--org",
      "airscripts",
      "--severity",
      "high",
      "--state",
      "open",
      "--limit",
      "10",
    ]);

    expect(dependabotService.list).toHaveBeenCalledWith({
      org: "airscripts",
      severity: "high",
      state: "open",
      limit: "10",
    });
  });

  it("dismiss calls service with parsed alert and options", async () => {
    const program = new Command();
    program.exitOverride();
    dependabotCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "security",
      "dependabot",
      "dismiss",
      "42",
      "--repo",
      "airscripts/gitfleet",
      "--reason",
      "false_positive",
      "--comment",
      "Not applicable",
      "--yes",
    ]);

    expect(dependabotService.dismiss).toHaveBeenCalledWith(42, {
      yes: true,
      reason: "false_positive",
      comment: "Not applicable",
      repo: "airscripts/gitfleet",
    });
  });
});
