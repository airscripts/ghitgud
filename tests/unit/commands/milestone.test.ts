import { Command } from "commander";
import { describe, expect, it } from "vitest";

import milestoneCommand from "@/commands/milestone";

describe("milestone command", () => {
  it("registers milestone subcommands", () => {
    const program = new Command();
    milestoneCommand.register(program);

    const milestone = program.commands.find(
      (command) => command.name() === "milestone",
    );

    expect(milestone).toBeDefined();
    expect(milestone!.commands.map((command) => command.name())).toEqual([
      "create",
      "list",
      "close",
      "progress",
    ]);
  });
});
