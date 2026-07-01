import { Command } from "commander";
import { describe, expect, it } from "vitest";
import gpgKeyCommand from "@/commands/identity-gpg";

describe("gpg-key command", () => {
  it("registers gpg-key subcommands", () => {
    const program = new Command();
    gpgKeyCommand.register(program);
    const gpgKey = program.commands[0].commands.find(
      (cmd) => cmd.name() === "gpg",
    );
    expect(gpgKey).toBeDefined();
    const names = gpgKey!.commands.map((cmd) => cmd.name());
    expect(names).toContain("list");
    expect(names).toContain("add");
    expect(names).toContain("delete");
  });
});
