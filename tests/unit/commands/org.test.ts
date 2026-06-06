import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import orgCommand from "@/commands/org";

vi.mock("@/services/org", () => ({
  default: {
    add: vi.fn(),
    list: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

describe("org command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register org with subcommands", () => {
    const program = new Command();
    orgCommand.register(program);

    const cmd = program.commands.find((c) => c.name() === "org");
    expect(cmd).toBeDefined();

    const subcommands = cmd!.commands.map((c) => c.name());
    expect(subcommands).toContain("members");
    expect(subcommands).toContain("invite");
    expect(subcommands).toContain("remove");
  });
});
