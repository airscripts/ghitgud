import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import runService from "@/services/run";
import runCommand from "@/commands/run";

vi.mock("@/services/run", () => ({
  default: {
    debugRun: vi.fn(),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

describe("run command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register run command with debug subcommand", () => {
    const program = new Command();
    runCommand.register(program);

    const run = program.commands.find((command) => command.name() === "run");
    expect(run).toBeDefined();

    const subcommands = run!.commands.map((command) => command.name());
    expect(subcommands).toContain("debug");
  });

  it("should reject invalid run ids before calling service", async () => {
    const program = new Command();
    program.exitOverride();
    runCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "run", "debug", "123abc"]),
    ).rejects.toThrow("Invalid run id: 123abc.");

    expect(runService.debugRun).not.toHaveBeenCalled();
  });
});
