import { Command } from "commander";
import { describe, expect, it } from "vitest";
import gpgKeyCommand from "@/commands/gpg-key";

describe("gpg-key command", () => {
  it("registers gpg-key subcommands", () => {
    const program = new Command();
    gpgKeyCommand.register(program);
    const gpgKey = program.commands.find((cmd) => cmd.name() === "gpg-key");
    expect(gpgKey).toBeDefined();
    const names = gpgKey!.commands.map((cmd) => cmd.name());
    expect(names).toContain("list");
    expect(names).toContain("add");
    expect(names).toContain("delete");
  });
});
