import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import profileCommand from "@/commands/profile";

vi.mock("@/services/profile", () => ({
  default: {
    add: vi.fn(),
    list: vi.fn(),
    switch: vi.fn(),
    detect: vi.fn(),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

vi.mock("@/core/prompt", () => ({
  default: {
    select: vi.fn((_: string, options: { value: string; label: string }[]) => {
      return Promise.resolve(options[0]?.value ?? "");
    }),

    confirm: vi.fn(),
    multiSelect: vi.fn(),
    text: vi.fn(() => ""),
    promptIfMissing: vi.fn(),
    guardNonInteractive: vi.fn(),
  },
}));

vi.mock("@/core/config", () => ({
  default: {
    listProfiles: vi.fn(() => []),
  },
}));

describe("profile command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register profile command with subcommands", () => {
    const program = new Command();
    profileCommand.register(program);

    const profile = program.commands.find((c) => c.name() === "profile");
    expect(profile).toBeDefined();

    const subcommands = profile!.commands.map((c) => c.name());
    expect(subcommands).toContain("add");
    expect(subcommands).toContain("list");
    expect(subcommands).toContain("switch");
    expect(subcommands).toContain("detect");
  });

  it("should reject missing profile name on profile add", async () => {
    const program = new Command();
    program.exitOverride();
    profileCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "profile", "add"]),
    ).rejects.toThrow("Profile name is required.");
  });

  it("should reject blank profile name on profile add", async () => {
    const program = new Command();
    program.exitOverride();
    profileCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "profile", "add", "   "]),
    ).rejects.toThrow("Profile name is required.");
  });

  it("should reject missing token on profile add", async () => {
    const program = new Command();
    program.exitOverride();
    profileCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "profile", "add", "work"]),
    ).rejects.toThrow("Token is required.");
  });

  it("should reject blank token on profile add", async () => {
    const program = new Command();
    program.exitOverride();
    profileCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "profile",
        "add",
        "work",
        "--token",
        "   ",
      ]),
    ).rejects.toThrow("Token is required.");
  });

  it("should reject switch with no profiles configured", async () => {
    const program = new Command();
    program.exitOverride();
    profileCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "profile", "switch"]),
    ).rejects.toThrow("No profiles configured");
  });
});
