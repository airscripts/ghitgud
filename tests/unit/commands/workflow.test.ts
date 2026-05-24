import { Command } from "commander";
import workflowCommand from "@/commands/workflow";
import { describe, it, expect } from "vitest";

describe("workflow command", () => {
  it("should register workflow command with subcommands", () => {
    const program = new Command();
    workflowCommand.register(program);

    const workflow = program.commands.find(
      (command) => command.name() === "workflow",
    );

    expect(workflow).toBeDefined();

    const subcommands = workflow!.commands.map((command) => command.name());
    expect(subcommands).toContain("validate");
    expect(subcommands).toContain("dry-run");
  });
});
