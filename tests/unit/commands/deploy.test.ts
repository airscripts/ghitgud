import { Command } from "commander";
import { describe, expect, it } from "vitest";
import deploymentCommand from "@/commands/deploy";

describe("deployment command", () => {
  it("registers deployment subcommands", () => {
    const program = new Command();
    deploymentCommand.register(program);
    const deployment = program.commands.find((cmd) => cmd.name() === "deploy");
    expect(deployment).toBeDefined();
    const names = deployment!.commands.map((cmd) => cmd.name());
    expect(names).toContain("list");
    expect(names).toContain("view");
    expect(names).toContain("create");
    expect(names).toContain("status");
    expect(names).toContain("status-create");
  });
});
