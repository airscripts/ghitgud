import { Command } from "commander";
import { describe, expect, it } from "vitest";
import advisoryCommand from "@/commands/advisory";

describe("advisory command", () => {
  it("registers advisory subcommands", () => {
    const program = new Command();
    advisoryCommand.register(program);
    const advisory = program.commands.find((cmd) => cmd.name() === "advisory");
    expect(advisory).toBeDefined();
    const names = advisory!.commands.map((cmd) => cmd.name());
    expect(names).toContain("list");
    expect(names).toContain("view");
  });
});
