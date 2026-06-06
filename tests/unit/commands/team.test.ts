import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import teamCommand from "@/commands/team";

vi.mock("@/services/team", () => ({
  default: {
    list: vi.fn(),
    create: vi.fn(),
    addMember: vi.fn(),
    removeMember: vi.fn(),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

describe("team command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register team with subcommands", () => {
    const program = new Command();
    teamCommand.register(program);

    const cmd = program.commands.find((c) => c.name() === "team");
    expect(cmd).toBeDefined();

    const subcommands = cmd!.commands.map((c) => c.name());
    expect(subcommands).toContain("list");
    expect(subcommands).toContain("create");
    expect(subcommands).toContain("add");
    expect(subcommands).toContain("remove");
  });
});
