import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import releaseCommand from "@/commands/release";
import releaseService from "@/services/release";

vi.mock("@/services/release", () => ({
  default: {
    bump: vi.fn(),
    notes: vi.fn(),
    draft: vi.fn(),
    verify: vi.fn(),
    changelog: vi.fn(),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

describe("release command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    vi.mocked(releaseService.bump).mockResolvedValue({
      success: true,
      next: "2.0.0",
      level: "major",
      current: "1.0.0",
    });

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

    expect(releaseService.bump).toHaveBeenCalledWith(
      expect.objectContaining({ level: "major" }),
    );
  });
});
