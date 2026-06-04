import { Command } from "commander";
import { describe, it, expect } from "vitest";

import secretsCommand from "@/commands/secrets";

describe("secrets command", () => {
  it("registers secrets subcommands", () => {
    const program = new Command();
    secretsCommand.register(program);

    const secrets = program.commands.find(
      (command) => command.name() === "secrets",
    );

    expect(secrets).toBeDefined();
    expect(secrets!.commands.map((command) => command.name())).toEqual([
      "scan",
      "alerts",
    ]);
  });
});
