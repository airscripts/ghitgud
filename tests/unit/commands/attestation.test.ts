import { Command } from "commander";
import { describe, expect, it } from "vitest";
import attestationCommand from "@/commands/attestation";

describe("attestation command", () => {
  it("registers attestation subcommands", () => {
    const program = new Command();
    attestationCommand.register(program);
    const att = program.commands.find((cmd) => cmd.name() === "attestation");
    expect(att).toBeDefined();
    const names = att!.commands.map((cmd) => cmd.name());
    expect(names).toContain("list");
    expect(names).toContain("verify");
  });
});
