import { Command } from "commander";
import { describe, it, expect } from "vitest";
import labelsCommand from "@/commands/label";

describe("labels command", () => {
  it("should register labels command with subcommands", () => {
    const program = new Command();
    labelsCommand.register(program);

    const labels = program.commands.find((c) => c.name() === "label");
    expect(labels).toBeDefined();
    const subcommands = labels!.commands.map((c) => c.name());

    expect(subcommands).toContain("list");
    expect(subcommands).toContain("add");
    expect(subcommands).toContain("get");
    expect(subcommands).toContain("edit");
    expect(subcommands).toContain("remove");
    expect(subcommands).toContain("pull");
    expect(subcommands).toContain("push");
    expect(subcommands).toContain("clone");
    expect(subcommands).toContain("prune");
  });
});
