import { Command } from "commander";
import { describe, it, expect } from "vitest";

import variableCommand from "@/commands/variable";

describe("variable command", () => {
  it("registers variable subcommands", () => {
    const program = new Command();
    variableCommand.register(program);

    const variable = program.commands.find(
      (command) => command.name() === "variable",
    );

    expect(variable).toBeDefined();
    expect(variable!.commands.map((command) => command.name())).toEqual([
      "list",
      "set",
      "delete",
    ]);
  });
});
