import { Command } from "commander";
import { describe, expect, it } from "vitest";
import forkCommand from "@/commands/fork";

describe("fork command", () => {
  it("registers fork subcommands", () => {
    const program = new Command();
    forkCommand.register(program);
    const fork = program.commands.find((command) => command.name() === "fork");
    expect(fork).toBeDefined();
    expect(fork!.commands.map((c) => c.name())).toEqual([
      "sync",
      "compare",
      "list",
      "create",
    ]);
  });
});
