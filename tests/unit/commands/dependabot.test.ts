import { Command } from "commander";
import { describe, it, expect } from "vitest";

import dependabotCommand from "@/commands/dependabot";

describe("dependabot command", () => {
  it("registers dependabot subcommands", () => {
    const program = new Command();
    dependabotCommand.register(program);

    const dependabot = program.commands.find(
      (command) => command.name() === "dependabot",
    );

    expect(dependabot).toBeDefined();
    expect(dependabot!.commands.map((command) => command.name())).toEqual([
      "list",
      "dismiss",
    ]);
  });
});
