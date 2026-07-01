import { Command } from "commander";
import { describe, it, expect } from "vitest";

import auditCommand from "@/commands/security-audit";

describe("audit command", () => {
  it("registers audit command", () => {
    const program = new Command();
    auditCommand.register(program);

    const audit = program.commands[0].commands.find(
      (command) => command.name() === "audit",
    );

    expect(audit).toBeDefined();
  });
});
