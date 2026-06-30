import { Command } from "commander";
import { describe, expect, it } from "vitest";
import codeCommand from "@/commands/code";

describe("code command", () => {
  it("registers code subcommands", () => {
    const program = new Command();
    codeCommand.register(program);
    const code = program.commands.find((cmd) => cmd.name() === "code");
    expect(code).toBeDefined();
    const names = code!.commands.map((cmd) => cmd.name());
    expect(names).toContain("search");
    expect(names).toContain("definitions");
    expect(names).toContain("references");
    expect(names).toContain("file");
    expect(names).toContain("blame");
  });
});
