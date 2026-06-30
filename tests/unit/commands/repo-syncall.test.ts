import { Command } from "commander";
import { describe, expect, it } from "vitest";
import repoCommand from "@/commands/repo";

describe("repo command", () => {
  it("registers syncall and statusall subcommands", () => {
    const program = new Command();
    repoCommand.register(program);
    const repo = program.commands.find((cmd) => cmd.name() === "repo");
    expect(repo).toBeDefined();
    const names = repo!.commands.map((cmd) => cmd.name());
    expect(names).toContain("syncall");
    expect(names).toContain("statusall");
  });
});
