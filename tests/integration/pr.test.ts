import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import prCommand from "@/commands/pr";

vi.mock("@/services/pr", () => ({
  default: {
    push: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    cleanup: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

vi.mock("@/services/stack", () => ({
  default: {
    next: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    push: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    list: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
    create: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    update: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

import prService from "@/services/pr";
import stackService from "@/services/stack";

describe("integration > pr commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cleanup calls service with dry-run and force flags", async () => {
    const program = new Command();
    program.exitOverride();
    prCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "pr",
      "cleanup",
      "--dry-run",
      "--force",
    ]);

    expect(prService.cleanup).toHaveBeenCalledWith({
      dryRun: true,
      force: true,
    });
  });

  it("push calls service with parsed pr number and force", async () => {
    const program = new Command();
    program.exitOverride();
    prCommand.register(program);

    await program.parseAsync(["node", "test", "pr", "push", "42", "-f"]);
    expect(prService.push).toHaveBeenCalledWith(42, true);
  });

  it("next calls stackService.next with options", async () => {
    const program = new Command();
    program.exitOverride();
    prCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "pr",
      "next",
      "--reverse",
      "--list",
    ]);

    expect(stackService.next).toHaveBeenCalledWith({
      list: true,
      reverse: true,
    });
  });

  it("stack create calls service with base branch", async () => {
    const program = new Command();
    program.exitOverride();
    prCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "pr",
      "stack",
      "create",
      "--base",
      "main",
    ]);

    expect(stackService.create).toHaveBeenCalledWith({ base: "main" });
  });

  it("stack list calls service", async () => {
    const program = new Command();
    program.exitOverride();
    prCommand.register(program);

    await program.parseAsync(["node", "test", "pr", "stack", "list"]);
    expect(stackService.list).toHaveBeenCalledTimes(1);
  });

  it("stack update calls service", async () => {
    const program = new Command();
    program.exitOverride();
    prCommand.register(program);

    await program.parseAsync(["node", "test", "pr", "stack", "update"]);
    expect(stackService.update).toHaveBeenCalledTimes(1);
  });

  it("stack push calls service with title and draft", async () => {
    const program = new Command();
    program.exitOverride();
    prCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "pr",
      "stack",
      "push",
      "--base",
      "main",
      "--title",
      "feat: stack",
      "--draft",
    ]);

    expect(stackService.push).toHaveBeenCalledWith({
      draft: true,
      title: "feat: stack",
    });
  });
});
