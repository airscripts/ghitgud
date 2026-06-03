import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import prCommand from "@/commands/pr";
import prService from "@/services/pr";

vi.mock("@/services/pr", () => ({
  default: {
    push: vi.fn(),
    cleanup: vi.fn(),
  },
}));

vi.mock("@/services/stack", () => ({
  default: {
    next: vi.fn(),
    list: vi.fn(),
    push: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

describe("pr command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers pr command with subcommands", () => {
    const program = new Command();
    prCommand.register(program);
    const pr = program.commands.find((command) => command.name() === "pr");

    expect(pr).toBeDefined();
    expect(pr!.commands.map((command) => command.name())).toContain("push");
    expect(pr!.commands.map((command) => command.name())).toContain("stack");
  });

  it("rejects invalid PR numbers before calling service", async () => {
    const program = new Command();
    program.exitOverride();
    prCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "pr", "push", "42abc"]),
    ).rejects.toThrow("Invalid PR number: 42abc.");

    expect(prService.push).not.toHaveBeenCalled();
  });
});
