import { Command } from "commander";
import { describe, expect, it } from "vitest";
import packageCommand from "@/commands/registry";

describe("package command", () => {
  it("registers package subcommands", () => {
    const program = new Command();
    packageCommand.register(program);
    const pkg = program.commands.find((cmd) => cmd.name() === "registry");
    expect(pkg).toBeDefined();
    const names = pkg!.commands.map((cmd) => cmd.name());
    expect(names).toContain("list");
    expect(names).toContain("view");
    expect(names).toContain("versions");
    expect(names).toContain("delete");
    expect(names).toContain("restore");
  });
});
