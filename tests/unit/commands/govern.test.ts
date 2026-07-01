import { Command } from "commander";
import reposCommand from "@/commands/govern";
import { describe, it, expect } from "vitest";

describe("repos command", () => {
  it("should register repos command with subcommands", () => {
    const program = new Command();
    reposCommand.register(program);

    const repos = program.commands.find(
      (command) => command.name() === "govern",
    );

    expect(repos).toBeDefined();

    const subcommands = repos!.commands.map((command) => command.name());
    expect(subcommands).toContain("inspect");
    expect(subcommands).toContain("govern");
    expect(subcommands).toContain("label");
    expect(subcommands).toContain("retire");
    expect(subcommands).toContain("report");
    expect(subcommands).toContain("clone");
  });

  it("should register clone command with expected options", () => {
    const program = new Command();
    reposCommand.register(program);

    const repos = program.commands.find(
      (command) => command.name() === "govern",
    );

    const clone = repos!.commands.find((command) => command.name() === "clone");
    expect(clone).toBeDefined();
    expect(clone!.description()).toContain("Clone");

    const optionNames = clone!.options.map((opt) => opt.long);
    expect(optionNames).toContain("--org");
    expect(optionNames).toContain("--user");
    expect(optionNames).toContain("--repos");
    expect(optionNames).toContain("--file");
    expect(optionNames).toContain("--limit");
    expect(optionNames).toContain("--include-forks");
    expect(optionNames).toContain("--include-private");
    expect(optionNames).toContain("--protocol");
    expect(optionNames).toContain("--dry-run");
  });
});
