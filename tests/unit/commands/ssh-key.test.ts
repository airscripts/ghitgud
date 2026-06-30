import { Command } from "commander";
import { describe, expect, it } from "vitest";
import sshKeyCommand from "@/commands/ssh-key";

describe("ssh-key command", () => {
  it("registers ssh-key subcommands", () => {
    const program = new Command();
    sshKeyCommand.register(program);
    const sshKey = program.commands.find((cmd) => cmd.name() === "ssh-key");
    expect(sshKey).toBeDefined();
    const names = sshKey!.commands.map((cmd) => cmd.name());
    expect(names).toContain("list");
    expect(names).toContain("add");
    expect(names).toContain("delete");
  });
});
