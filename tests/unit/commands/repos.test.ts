import { Command } from "commander";
import reposCommand from "@/commands/repos";
import { describe, it, expect } from "vitest";

describe("repos command", () => {
  it("should register repos command with subcommands", () => {
    const program = new Command();
    reposCommand.register(program);

    const repos = program.commands.find(
      (command) => command.name() === "repos",
    );

    expect(repos).toBeDefined();

    const subcommands = repos!.commands.map((command) => command.name());
    expect(subcommands).toContain("inspect");
    expect(subcommands).toContain("govern");
    expect(subcommands).toContain("label");
    expect(subcommands).toContain("retire");
    expect(subcommands).toContain("report");
  });
});
