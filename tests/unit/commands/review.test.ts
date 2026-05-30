import { describe, it, expect } from "vitest";

import { Command } from "commander";
import reviewCommand from "@/commands/review";

describe("review command", () => {
  it("should register review command with subcommands", () => {
    const program = new Command();
    reviewCommand.register(program);

    const review = program.commands.find(
      (command) => command.name() === "review",
    );

    expect(review).toBeDefined();
    const subcommands = review!.commands.map((command) => command.name());

    expect(subcommands).toContain("comment");
    expect(subcommands).toContain("threads");
    expect(subcommands).toContain("resolve");
    expect(subcommands).toContain("suggest");
    expect(subcommands).toContain("apply");
  });
});
