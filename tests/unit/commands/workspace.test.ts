import { Command } from "commander";
import { describe, expect, it } from "vitest";
import workspaceCommand from "@/commands/workspace";

describe("workspace command", () => {
  it("registers workspace subcommands", () => {
    const program = new Command();
    workspaceCommand.register(program);
    const workspace = program.commands.find(
      (cmd) => cmd.name() === "workspace",
    );
    expect(workspace).toBeDefined();
    const names = workspace!.commands.map((cmd) => cmd.name());
    expect(names).toContain("define");
    expect(names).toContain("list");
    expect(names).toContain("run");
  });
});
