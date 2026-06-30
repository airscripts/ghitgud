import { Command } from "commander";
import { describe, expect, it } from "vitest";
import depsCommand from "@/commands/deps";

describe("deps command", () => {
  it("registers deps subcommands", () => {
    const program = new Command();
    depsCommand.register(program);
    const deps = program.commands.find((cmd) => cmd.name() === "deps");
    expect(deps).toBeDefined();
    const names = deps!.commands.map((cmd) => cmd.name());
    expect(names).toEqual(["list", "direct", "review"]);
  });
});
