import { Command } from "commander";
import { describe, it, expect } from "vitest";

import secretCommand from "@/commands/secret";

describe("secret command", () => {
  it("registers secret subcommands", () => {
    const program = new Command();
    secretCommand.register(program);

    const secret = program.commands.find(
      (command) => command.name() === "secret",
    );

    expect(secret).toBeDefined();
    expect(secret!.commands.map((command) => command.name())).toEqual([
      "list",
      "set",
      "delete",
    ]);
  });
});
