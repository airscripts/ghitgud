import { Command } from "commander";
import { describe, expect, it } from "vitest";
import commentCommand from "@/commands/comment";

describe("comment command", () => {
  it("registers comment subcommands", () => {
    const program = new Command();
    commentCommand.register(program);
    const comment = program.commands.find((cmd) => cmd.name() === "comment");
    expect(comment).toBeDefined();
    const names = comment!.commands.map((cmd) => cmd.name());
    expect(names).toContain("list");
    expect(names).toContain("reply");
    expect(names).toContain("delete");
  });
});
