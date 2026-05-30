import { Command } from "commander";
import cacheCommand from "@/commands/cache";
import { describe, it, expect } from "vitest";

describe("cache command", () => {
  it("should register cache command with subcommands", () => {
    const program = new Command();
    cacheCommand.register(program);

    const cache = program.commands.find(
      (command) => command.name() === "cache",
    );

    expect(cache).toBeDefined();
    const subcommands = cache!.commands.map((command) => command.name());
    expect(subcommands).toContain("inspect");
    expect(subcommands).toContain("download");
  });
});
