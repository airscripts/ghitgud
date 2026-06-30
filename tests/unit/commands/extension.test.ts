import { Command } from "commander";
import { describe, expect, it } from "vitest";
import extensionCommand from "@/commands/extension";

describe("extension command", () => {
  it("registers extension subcommands", () => {
    const program = new Command();
    extensionCommand.register(program);
    const ext = program.commands.find((cmd) => cmd.name() === "extension");
    expect(ext).toBeDefined();
    const names = ext!.commands.map((cmd) => cmd.name());
    expect(names).toContain("list");
    expect(names).toContain("install");
    expect(names).toContain("remove");
    expect(names).toContain("upgrade");
    expect(names).toContain("create");
    expect(names).toContain("exec");
  });
});
