import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import discussionCommand from "@/commands/discussion";

vi.mock("@/services/discussion", () => ({
  default: {
    list: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
    view: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    close: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    create: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    comment: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    categories: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
  },
}));

import discussionService from "@/services/discussion";

describe("integration > discussion commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list calls service with category and limit", async () => {
    const program = new Command();
    program.exitOverride();
    discussionCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "discussion",
      "list",
      "--category",
      "General",
      "--limit",
      "10",
    ]);

    expect(discussionService.list).toHaveBeenCalledWith({
      category: "General",
      limit: 10,
    });
  });

  it("view calls service with discussion number", async () => {
    const program = new Command();
    program.exitOverride();
    discussionCommand.register(program);

    await program.parseAsync(["node", "test", "discussion", "view", "42"]);
    expect(discussionService.view).toHaveBeenCalledWith("42");
  });

  it("create calls service with required options", async () => {
    const program = new Command();
    program.exitOverride();
    discussionCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "discussion",
      "create",
      "--title",
      "Hello",
      "--category",
      "General",
      "--body",
      "World",
    ]);

    expect(discussionService.create).toHaveBeenCalledWith({
      body: "World",
      title: "Hello",
      category: "General",
    });
  });

  it("comment calls service with number and body", async () => {
    const program = new Command();
    program.exitOverride();
    discussionCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "discussion",
      "comment",
      "42",
      "--body",
      "Nice post",
    ]);

    expect(discussionService.comment).toHaveBeenCalledWith("42", "Nice post");
  });

  it("close calls service with discussion number", async () => {
    const program = new Command();
    program.exitOverride();
    discussionCommand.register(program);

    await program.parseAsync(["node", "test", "discussion", "close", "42"]);
    expect(discussionService.close).toHaveBeenCalledWith("42");
  });

  it("categories calls service without args", async () => {
    const program = new Command();
    program.exitOverride();
    discussionCommand.register(program);

    await program.parseAsync(["node", "test", "discussion", "categories"]);
    expect(discussionService.categories).toHaveBeenCalledTimes(1);
  });
});
