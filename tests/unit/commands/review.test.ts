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

vi.mock("@/core/repo", () => ({
  default: {
    resolveRepo: vi.fn().mockResolvedValue("airscripts/gitfleet"),
    resolveRepoSync: vi.fn().mockReturnValue("airscripts/gitfleet"),
    resolveRepos: vi.fn().mockResolvedValue(["airscripts/gitfleet"]),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

vi.mock("@/core/prompt", () => ({
  default: {
    text: vi.fn((message: string, options: { placeholder?: string }) => {
      if (options?.placeholder === "42") return "42";
      if (options?.placeholder === "10") return "10";
      if (options?.placeholder === "123456") return "123456";
      if (options?.placeholder === "src/main.ts") return "src/main.ts";

      if (options?.placeholder === "Consider using a constant here.")
        return "Consider using a constant here.";

      if (options?.placeholder === "const x = 1;") return "const x = 1;";
      return "mocked";
    }),

    guardNonInteractive: vi.fn(),
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
    ).rejects.toThrow("Invalid change: 12abc.");

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

  it("should call threads service with valid PR", async () => {
    const program = new Command();
    program.exitOverride();
    reviewCommand.register(program);

    await program.parseAsync(["node", "test", "review", "threads", "42"]);
    expect(reviewService.threads).toHaveBeenCalledWith(
      42,
      "airscripts/gitfleet",
    );
  });

  it("should call threads service with repo option", async () => {
    const program = new Command();
    program.exitOverride();
    reviewCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "review",
      "threads",
      "42",
      "--repo",
      "owner/repo",
    ]);

    expect(reviewService.threads).toHaveBeenCalledWith(
      42,
      "airscripts/gitfleet",
    );
  });

  it("should call resolve service with valid args", async () => {
    const program = new Command();
    program.exitOverride();
    reviewCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "review",
      "resolve",
      "123456",
      "42",
    ]);

    expect(reviewService.resolve).toHaveBeenCalledWith(
      123456,
      "airscripts/gitfleet",
      42,
    );
  });

  it("should call suggest service with valid args", async () => {
    const program = new Command();
    program.exitOverride();
    reviewCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "review",
      "suggest",
      "42",
      "--file",
      "src/main.ts",
      "--line",
      "10",
      "--replace",
      "const x = 1;",
    ]);

    expect(reviewService.suggest).toHaveBeenCalledWith({
      pr: 42,
      line: 10,
      file: "src/main.ts",
      replace: "const x = 1;",
      repo: "airscripts/gitfleet",
    });
  });

  it("should call apply service with valid args", async () => {
    const program = new Command();
    program.exitOverride();
    reviewCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "review",
      "apply",
      "42",
      "--repo",
      "owner/repo",
      "--push",
    ]);

    expect(reviewService.apply).toHaveBeenCalledWith(
      42,
      "airscripts/gitfleet",
      true,
    );
  });

  it("should reject missing PR number on threads", async () => {
    const program = new Command();
    program.exitOverride();
    reviewCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "review", "threads"]),
    ).rejects.toThrow("Change number is required.");

    expect(reviewService.threads).not.toHaveBeenCalled();
  });

  it("should reject missing thread id on resolve", async () => {
    const program = new Command();
    program.exitOverride();
    reviewCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "review", "resolve"]),
    ).rejects.toThrow("Thread id is required.");

    expect(reviewService.resolve).not.toHaveBeenCalled();
  });

  it("should reject missing comment body on comment", async () => {
    const program = new Command();
    program.exitOverride();
    reviewCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "review",
        "comment",
        "42",
        "--file",
        "src/main.ts",
        "--line",
        "10",
      ]),
    ).rejects.toThrow("Comment body is required.");

    expect(reviewService.comment).not.toHaveBeenCalled();
  });

  it("should call comment service with all args", async () => {
    const program = new Command();
    program.exitOverride();
    reviewCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "review",
      "comment",
      "42",
      "--file",
      "src/main.ts",
      "--line",
      "10",
      "--body",
      "Looks good.",
      "--side",
      "LEFT",
    ]);

    expect(reviewService.comment).toHaveBeenCalledWith({
      pr: 42,
      line: 10,
      side: "LEFT",
      file: "src/main.ts",
      body: "Looks good.",
      repo: "airscripts/gitfleet",
    });
  });
});
