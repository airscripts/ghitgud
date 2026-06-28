import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import complianceCommand from "@/commands/compliance";

vi.mock("@/services/compliance", () => ({
  default: {
    check: vi.fn(),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

describe("compliance command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers compliance check command", () => {
    const program = new Command();
    complianceCommand.register(program);

    const compliance = program.commands.find(
      (command) => command.name() === "compliance",
    );

    expect(compliance).toBeDefined();
    expect(compliance!.commands.map((command) => command.name())).toContain(
      "check",
    );
  });

  it("should reject compliance check with no repo target", async () => {
    const program = new Command();
    program.exitOverride();
    complianceCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "compliance", "check"]),
    ).rejects.toThrow("No repository target provided.");
  });
});
