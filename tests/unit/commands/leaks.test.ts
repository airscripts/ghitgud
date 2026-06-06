import { Command } from "commander";
import { describe, it, expect } from "vitest";

import leaksCommand from "@/commands/leaks";

describe("leaks command", () => {
  it("registers leaks subcommands", () => {
    const program = new Command();
    leaksCommand.register(program);

    const leaks = program.commands.find(
      (command) => command.name() === "leaks",
    );

    expect(leaks).toBeDefined();
    expect(leaks!.commands.map((command) => command.name())).toEqual([
      "scan",
      "alerts",
    ]);
  });
});
