import { Command } from "commander";
import { describe, expect, it } from "vitest";
import runnerCommand from "@/commands/runner";

describe("runner command", () => {
  it("registers runner subcommands", () => {
    const program = new Command();
    runnerCommand.register(program);
    const runner = program.commands.find((cmd) => cmd.name() === "runner");
    expect(runner).toBeDefined();
    const names = runner!.commands.map((cmd) => cmd.name());
    expect(names).toContain("list");
    expect(names).toContain("view");
    expect(names).toContain("status");
    expect(names).toContain("remove");
    expect(names).toContain("labels");
  });
});
