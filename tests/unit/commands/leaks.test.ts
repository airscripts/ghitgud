import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import leaksCommand from "@/commands/security-leaks";

vi.mock("@/services/leaks", () => ({
  default: {
    scan: vi.fn(),
    alerts: vi.fn(),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

describe("leaks command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers leaks subcommands", () => {
    const program = new Command();
    leaksCommand.register(program);

    const leaks = program.commands[0]?.commands.find(
      (command) => command.name() === "leaks",
    );

    expect(leaks).toBeDefined();
    expect(leaks!.commands.map((command) => command.name())).toEqual([
      "scan",
      "alerts",
    ]);
  });

  it("should reject leaks alerts with no repo target", async () => {
    const program = new Command();
    program.exitOverride();
    leaksCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "security", "leaks", "alerts"]),
    ).rejects.toThrow("No repository target provided.");
  });
});
