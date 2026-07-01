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
      "create",
      "list",
      "view",
      "edit",
      "lock",
      "unlock",
      "pin",
      "unpin",
      "close",
      "reopen",
      "comment",
      "delete",
      "transfer",
      "status",
      "subtasks",
      "parent",
      "type",
    ]);
  });

  it("close subcommand has --comment option", () => {
    const program = new Command();
    issueCommand.register(program);

    const issue = program.commands.find((c) => c.name() === "issue");
    const close = issue!.commands.find((c) => c.name() === "close");

    expect(close).toBeDefined();
    const optionFlags = close!.options.map((o) => o.long);
    expect(optionFlags).toContain("--comment");
  });

  it("reopen subcommand has --comment option", () => {
    const program = new Command();
    issueCommand.register(program);

    const issue = program.commands.find((c) => c.name() === "issue");
    const reopen = issue!.commands.find((c) => c.name() === "reopen");

    expect(reopen).toBeDefined();
    const optionFlags = reopen!.options.map((o) => o.long);
    expect(optionFlags).toContain("--comment");
  });
});
