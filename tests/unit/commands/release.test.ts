import { Command } from "commander";
import { describe, it, expect } from "vitest";
import releaseCommand from "@/commands/release";

describe("release command", () => {
  it("should register release command with subcommands", () => {
    const program = new Command();
    releaseCommand.register(program);

    const release = program.commands.find((c) => c.name() === "release");
    expect(release).toBeDefined();

    const subcommands = release!.commands.map((c) => c.name());
    expect(subcommands).toContain("changelog");
    expect(subcommands).toContain("bump");
    expect(subcommands).toContain("verify");
    expect(subcommands).toContain("notes");
    expect(subcommands).toContain("draft");
  });

  it("should have correct bump flags", () => {
    const program = new Command();
    releaseCommand.register(program);

    const bump = program.commands
      .find((c) => c.name() === "release")
      ?.commands.find((c) => c.name() === "bump");

    expect(bump).toBeDefined();
    expect(bump?.options.map((o) => o.long)).toContain("--level");
    expect(bump?.options.map((o) => o.long)).toContain("--create");
    expect(bump?.options.map((o) => o.long)).toContain("--push");
  });

  it("should reject invalid --level values", async () => {
    const program = new Command();
    program.exitOverride();
    releaseCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "release",
        "bump",
        "--level",
        "beta",
      ]),
    ).rejects.toThrow("Invalid level: beta. Expected: major, minor, patch.");
  });

  it("should accept valid --level values", async () => {
    const program = new Command();
    program.exitOverride();
    releaseCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "release",
        "bump",
        "--level",
        "major",
      ]),
    ).resolves.toBeDefined();
  });
});
