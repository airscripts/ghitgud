import { Command } from "commander";
import { describe, it, expect } from "vitest";

import environmentCommand from "@/commands/environment";

describe("environment command", () => {
  it("registers environment subcommands", () => {
    const program = new Command();
    environmentCommand.register(program);

    const environment = program.commands.find(
      (command) => command.name() === "environment",
    );

    expect(environment).toBeDefined();
    expect(environment!.commands.map((command) => command.name())).toEqual([
      "list",
      "create",
      "protection",
    ]);
  });
});
