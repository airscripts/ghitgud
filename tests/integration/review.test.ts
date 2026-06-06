import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import reviewCommand from "@/commands/review";

vi.mock("@/services/review", () => ({
  default: {
    apply: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    comment: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    threads: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
    resolve: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    suggest: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

import reviewService from "@/services/review";

describe("integration > review commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("comment calls service with all options", async () => {
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
      "--repo",
      "owner/repo",
    ]);

    expect(reviewService.comment).toHaveBeenCalledWith({
      pr: 42,
      line: 10,
      side: "LEFT",
      repo: "owner/repo",
      body: "Looks good.",
      file: "src/main.ts",
    });
  });

  it("threads calls service with pr and repo", async () => {
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

    expect(reviewService.threads).toHaveBeenCalledWith(42, "owner/repo");
  });

  it("resolve calls service with threadId, repo, and pr", async () => {
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
      "--repo",
      "owner/repo",
    ]);

    expect(reviewService.resolve).toHaveBeenCalledWith(
      123456,
      "owner/repo",
      42,
    );
  });

  it("suggest calls service with all options", async () => {
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
      "--repo",
      "owner/repo",
    ]);

    expect(reviewService.suggest).toHaveBeenCalledWith({
      pr: 42,
      line: 10,
      repo: "owner/repo",
      file: "src/main.ts",
      replace: "const x = 1;",
    });
  });

  it("apply calls service with pr, repo, and push", async () => {
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

    expect(reviewService.apply).toHaveBeenCalledWith(42, "owner/repo", true);
  });
});
