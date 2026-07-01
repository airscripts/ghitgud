import { Command } from "commander";
import { describe, expect, it } from "vitest";
import branchCommand from "@/commands/policy-branch";

describe("branch command", () => {
  it("registers stale and sweep subcommands", () => {
    const program = new Command();
    branchCommand.register(program);
    const branch = program.commands[0].commands.find(
      (cmd) => cmd.name() === "branch",
    );
    expect(branch).toBeDefined();
    const names = branch!.commands.map((cmd) => cmd.name());
    expect(names).toContain("stale");
    expect(names).toContain("sweep");
  });
});
