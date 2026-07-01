import { Command } from "commander";
import { describe, expect, it } from "vitest";
import codespaceCommand from "@/commands/dev";

describe("codespace command", () => {
  it("registers codespace subcommands", () => {
    const program = new Command();
    codespaceCommand.register(program);
    const cs = program.commands.find((cmd) => cmd.name() === "dev");
    expect(cs).toBeDefined();
    const names = cs!.commands.map((cmd) => cmd.name());
    expect(names).toContain("list");
    expect(names).toContain("view");
    expect(names).toContain("create");
    expect(names).toContain("start");
    expect(names).toContain("stop");
    expect(names).toContain("delete");
  });
});
