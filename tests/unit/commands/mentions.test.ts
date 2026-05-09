import { Command } from "commander";
import { describe, it, expect } from "vitest";
import mentionsCommand from "@/commands/mentions";

describe("mentions command", () => {
  it("should register mentions command on program", () => {
    const program = new Command();
    mentionsCommand.register(program);
    const commands = program.commands.map((c) => c.name());
    expect(commands).toContain("mentions");
  });
});
