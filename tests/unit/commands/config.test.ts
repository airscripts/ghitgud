import { Command } from "commander";
import { describe, it, expect } from "vitest";
import configCommand from "@/commands/config";

describe("config command", () => {
  it("should register config command with subcommands", () => {
    const program = new Command();
    configCommand.register(program);
    const config = program.commands.find((c) => c.name() === "config");

    expect(config).toBeDefined();
    const subcommands = config!.commands.map((c) => c.name());
    expect(subcommands).toContain("set");
    expect(subcommands).toContain("get");
  });
});
