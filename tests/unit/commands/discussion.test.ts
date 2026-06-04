import { Command } from "commander";
import { describe, expect, it } from "vitest";

import discussionCommand from "@/commands/discussion";

describe("discussion command", () => {
  it("registers discussion subcommands", () => {
    const program = new Command();
    discussionCommand.register(program);

    const discussion = program.commands.find(
      (command) => command.name() === "discussion",
    );

    expect(discussion).toBeDefined();
    expect(discussion!.commands.map((command) => command.name())).toEqual([
      "list",
      "view",
      "create",
      "comment",
      "close",
      "pin",
      "unpin",
      "categories",
    ]);
  });
});
