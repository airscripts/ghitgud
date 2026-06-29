import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import configCommand from "@/commands/config";

vi.mock("@/services/config", () => ({
  default: {
    set: vi.fn(() => {
      throw new Error("Unsupported key.");
    }),

    get: vi.fn(() => {
      throw new Error("Unsupported key.");
    }),

    unset: vi.fn(() => {
      throw new Error("Unsupported key.");
    }),
  },
}));

describe("integration > config commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register config command with subcommands", () => {
    const program = new Command();
    configCommand.register(program);
    const config = program.commands.find((c) => c.name() === "config");

    expect(config).toBeDefined();
    const subcommands = config!.commands.map((c) => c.name());
    expect(subcommands).toContain("set");
    expect(subcommands).toContain("get");
    expect(subcommands).toContain("unset");
  });

  it("should reject unsupported key on set", async () => {
    const program = new Command();
    program.exitOverride();
    configCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "config", "set", "token", "value"]),
    ).rejects.toThrow();
  });
});
