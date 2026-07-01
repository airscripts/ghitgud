import { Command } from "commander";
import { describe, expect, it } from "vitest";
import reactCommand from "@/commands/review-reaction";

describe("react command", () => {
  it("registers react subcommands", () => {
    const program = new Command();
    reactCommand.register(program);
    const react = program.commands[0].commands.find(
      (cmd) => cmd.name() === "reaction",
    );
    expect(react).toBeDefined();
    const names = react!.commands.map((cmd) => cmd.name());
    expect(names).toContain("list");
    expect(names).toContain("add");
    expect(names).toContain("remove");
  });
});
