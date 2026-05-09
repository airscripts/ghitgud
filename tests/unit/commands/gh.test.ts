import { Command } from "commander";
import { describe, it, expect } from "vitest";
import ghCommand from "@/commands/gh";

describe("gh command", () => {
  it("should register gh command on program", () => {
    const program = new Command();
    ghCommand.register(program);
    const commands = program.commands.map((c) => c.name());
    expect(commands).toContain("gh");
  });
});
