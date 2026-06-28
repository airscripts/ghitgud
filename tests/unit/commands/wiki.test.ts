import { Command } from "commander";
import { describe, expect, it } from "vitest";

import wikiCommand from "@/commands/wiki";

describe("wiki command", () => {
  it("registers wiki subcommands", () => {
    const program = new Command();
    wikiCommand.register(program);
    const wiki = program.commands.find((item) => item.name() === "wiki");

    expect(wiki?.commands.map((item) => item.name())).toEqual([
      "list",
      "view",
      "edit",
      "create",
      "delete",
    ]);
  });
});
