import { Command } from "commander";
import { describe, it, expect } from "vitest";
import labelsCommand from "@/commands/labels";

describe("labels command", () => {
  it("should register labels command with subcommands", () => {
    const program = new Command();
    labelsCommand.register(program);

    const labels = program.commands.find((c) => c.name() === "labels");
    expect(labels).toBeDefined();
    const subcommands = labels!.commands.map((c) => c.name());

    expect(subcommands).toContain("list");
    expect(subcommands).toContain("pull");
    expect(subcommands).toContain("push");
    expect(subcommands).toContain("prune");
  });
});
