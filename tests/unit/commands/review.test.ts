import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import reviewService from "@/services/review";
import reviewCommand from "@/commands/review";

vi.mock("@/services/review", () => ({
  default: {
    apply: vi.fn(),
    comment: vi.fn(),
    resolve: vi.fn(),
    suggest: vi.fn(),
    threads: vi.fn(),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

describe("review command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register review command with subcommands", () => {
    const program = new Command();
    reviewCommand.register(program);

    const review = program.commands.find(
      (command) => command.name() === "review",
    );

    expect(review).toBeDefined();
    const subcommands = review!.commands.map((command) => command.name());

    expect(subcommands).toContain("comment");
    expect(subcommands).toContain("threads");
    expect(subcommands).toContain("resolve");
    expect(subcommands).toContain("suggest");
    expect(subcommands).toContain("apply");
  });

  it("should reject invalid PR numbers before calling service", async () => {
    const program = new Command();
    program.exitOverride();
    reviewCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "review", "threads", "12abc"]),
    ).rejects.toThrow("Invalid PR: 12abc.");

    expect(reviewService.threads).not.toHaveBeenCalled();
  });

  it("should reject invalid line numbers before calling service", async () => {
    const program = new Command();
    program.exitOverride();
    reviewCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "review",
        "comment",
        "12",
        "--file",
        "src/main.ts",
        "--line",
        "7x",
        "--body",
        "Looks good.",
      ]),
    ).rejects.toThrow("Invalid line: 7x.");

    expect(reviewService.comment).not.toHaveBeenCalled();
  });
});
