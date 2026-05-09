import { Command } from "commander";
import { describe, it, expect } from "vitest";
import activityCommand from "@/commands/activity";

describe("activity command", () => {
  it("should register activity command on program", () => {
    const program = new Command();
    activityCommand.register(program);
    const commands = program.commands.map((c) => c.name());
    expect(commands).toContain("activity");
  });
});
