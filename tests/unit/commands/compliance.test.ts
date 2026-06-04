import { Command } from "commander";
import { describe, it, expect } from "vitest";

import complianceCommand from "@/commands/compliance";

describe("compliance command", () => {
  it("registers compliance check command", () => {
    const program = new Command();
    complianceCommand.register(program);

    const compliance = program.commands.find(
      (command) => command.name() === "compliance",
    );

    expect(compliance).toBeDefined();
    expect(compliance!.commands.map((command) => command.name())).toContain(
      "check",
    );
  });
});
