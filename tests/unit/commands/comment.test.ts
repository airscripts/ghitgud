import { Command } from "commander";
import { describe, expect, it } from "vitest";
import commentCommand from "@/commands/review-conversation";

describe("comment command", () => {
  it("registers comment subcommands", () => {
    const program = new Command();
    commentCommand.register(program);
    const comment = program.commands[0].commands.find(
      (cmd) => cmd.name() === "conversation",
    );
    expect(comment).toBeDefined();
    const names = comment!.commands.map((cmd) => cmd.name());
    expect(names).toContain("list");
    expect(names).toContain("reply");
    expect(names).toContain("delete");
  });
});
