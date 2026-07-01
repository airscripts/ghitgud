import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import prCommand from "@/commands/pr";
import prService from "@/services/pr";

vi.mock("@/services/pr", () => ({
  default: {
    create: vi.fn(),
    list: vi.fn(),
    view: vi.fn(),
    edit: vi.fn(),
    close: vi.fn(),
    reopen: vi.fn(),
    closeWithComment: vi.fn(),
    reopenWithComment: vi.fn(),
    merge: vi.fn(),
    checkout: vi.fn(),
    diff: vi.fn(),
    checks: vi.fn(),
    comment: vi.fn(),
    lock: vi.fn(),
    unlock: vi.fn(),
    ready: vi.fn(),
    status: vi.fn(),
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
    expect(pr!.commands.map((command) => command.name())).toContain("merge");
    expect(pr!.commands.map((command) => command.name())).toContain("checks");
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

  it("rejects conflicting merge strategies", async () => {
    const program = new Command();
    program.exitOverride();
    prCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "pr",
        "merge",
        "42",
        "--merge",
        "--squash",
      ]),
    ).rejects.toThrow("Use only one of --merge, --squash, or --rebase.");

    expect(prService.merge).not.toHaveBeenCalled();
  });

  it("close subcommand has --comment option", () => {
    const program = new Command();
    prCommand.register(program);

    const pr = program.commands.find((c) => c.name() === "pr");
    const close = pr!.commands.find((c) => c.name() === "close");

    expect(close).toBeDefined();
    const optionFlags = close!.options.map((o) => o.long);
    expect(optionFlags).toContain("--comment");
  });

  it("reopen subcommand has --comment option", () => {
    const program = new Command();
    prCommand.register(program);

    const pr = program.commands.find((c) => c.name() === "pr");
    const reopen = pr!.commands.find((c) => c.name() === "reopen");

    expect(reopen).toBeDefined();
    const optionFlags = reopen!.options.map((o) => o.long);
    expect(optionFlags).toContain("--comment");
  });
});
