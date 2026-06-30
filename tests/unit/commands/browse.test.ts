import { Command } from "commander";
import { describe, expect, it } from "vitest";
import browseCommand from "@/commands/browse";

describe("browse command", () => {
  it("registers browse subcommands", () => {
    const program = new Command();
    browseCommand.register(program);
    const browse = program.commands.find((cmd) => cmd.name() === "browse");
    expect(browse).toBeDefined();
    const names = browse!.commands.map((cmd) => cmd.name());
    expect(names).toContain("repo");
    expect(names).toContain("issues");
    expect(names).toContain("pulls");
    expect(names).toContain("actions");
    expect(names).toContain("settings");
    expect(names).toContain("releases");
    expect(names).toContain("pr");
  });
});
