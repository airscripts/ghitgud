import { Command } from "commander";
import runCommand from "@/commands/run";
import { describe, it, expect } from "vitest";

describe("run command", () => {
  it("should register run command with debug subcommand", () => {
    const program = new Command();
    runCommand.register(program);

    const run = program.commands.find((command) => command.name() === "run");
    expect(run).toBeDefined();

    const subcommands = run!.commands.map((command) => command.name());
    expect(subcommands).toContain("debug");
  });
});
