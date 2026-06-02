import { Command } from "commander";
import { describe, expect, it } from "vitest";

import issueCommand from "@/commands/issue";

describe("issue command", () => {
  it("registers issue subcommands", () => {
    const program = new Command();
    issueCommand.register(program);

    const issue = program.commands.find(
      (command) => command.name() === "issue",
    );

    expect(issue).toBeDefined();
    expect(issue!.commands.map((command) => command.name())).toEqual([
      "subtasks",
      "parent",
    ]);
  });
});
