import { Command } from "commander";
import { describe, it, expect, vi } from "vitest";

import profileCommand from "@/commands/profile";

vi.mock("@/services/profile", () => ({
  default: {
    add: vi.fn(),
    list: vi.fn(),
    switch: vi.fn(),
    detect: vi.fn(),
  },
}));

describe("profile command", () => {
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
});
