import { Command } from "commander";
import { describe, expect, it } from "vitest";
import actionsCommand from "@/commands/actions";

describe("actions command", () => {
  it("registers actions subcommands", () => {
    const program = new Command();
    actionsCommand.register(program);
    const actions = program.commands.find((cmd) => cmd.name() === "actions");
    expect(actions).toBeDefined();
    const names = actions!.commands.map((cmd) => cmd.name());
    expect(names).toContain("usage");
    expect(names).toContain("cost");
    expect(names).toContain("top-spenders");
    expect(names).toContain("export");
  });
});
