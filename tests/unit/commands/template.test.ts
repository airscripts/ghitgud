import { Command } from "commander";
import { describe, expect, it } from "vitest";
import templateCommand from "@/commands/template";

describe("template command", () => {
  it("registers template subcommands", () => {
    const program = new Command();
    templateCommand.register(program);
    const template = program.commands.find((cmd) => cmd.name() === "template");
    expect(template).toBeDefined();
    const names = template!.commands.map((cmd) => cmd.name());
    expect(names).toContain("list");
    expect(names).toContain("show");
  });
});
