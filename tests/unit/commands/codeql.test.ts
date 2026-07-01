import { Command } from "commander";
import { describe, expect, it } from "vitest";
import codeqlCommand from "@/commands/security-codeql";

describe("codeql command", () => {
  it("registers codeql subcommands", () => {
    const program = new Command();
    codeqlCommand.register(program);
    const codeql = program.commands[0].commands.find(
      (cmd) => cmd.name() === "codeql",
    );
    expect(codeql).toBeDefined();
    const names = codeql!.commands.map((cmd) => cmd.name());
    expect(names).toContain("list");
    expect(names).toContain("view");
    expect(names).toContain("dismiss");
  });
});
