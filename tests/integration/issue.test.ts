import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import issueCommand from "@/commands/issue";

vi.mock("@/services/issue", () => ({
  default: {
    parent: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    subtasks: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
  },
}));

import issueService from "@/services/issue";

describe("integration > issue commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("subtasks calls service with issue number and options", async () => {
    const program = new Command();
    program.exitOverride();
    issueCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "issue",
      "subtasks",
      "42",
      "--create",
      "--title",
      "Child",
      "--body",
      "Desc",
    ]);

    expect(issueService.subtasks).toHaveBeenCalledWith("42", {
      create: true,
      body: "Desc",
      title: "Child",
    });
  });

  it("parent calls service with child and parent numbers", async () => {
    const program = new Command();
    program.exitOverride();
    issueCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "issue",
      "parent",
      "42",
      "--parent",
      "1",
    ]);

    expect(issueService.parent).toHaveBeenCalledWith("42", { parent: "1" });
  });
});
