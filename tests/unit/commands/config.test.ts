import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import configCommand from "@/commands/config";

vi.mock("@/services/config", () => ({
  default: {
    read: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    unset: vi.fn(),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

vi.mock("@/core/prompt", () => ({
  default: {
    text: vi.fn(),
    select: vi.fn(),
  },
}));

describe("config command", () => {
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
});
