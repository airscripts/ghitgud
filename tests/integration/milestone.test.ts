import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import milestoneCommand from "@/commands/milestone";

vi.mock("@/services/milestone", () => ({
  default: {
    list: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
    close: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    create: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    progress: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

vi.mock("@/core/repo", () => ({
  default: {
    resolveRepo: vi.fn(() => Promise.resolve("owner/repo")),
  },
}));

import milestoneService from "@/services/milestone";

describe("integration > milestone commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create calls service with title and due date", async () => {
    const program = new Command();
    program.exitOverride();
    milestoneCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "milestone",
      "create",
      "--title",
      "v2.10.0",
      "--due",
      "2026-12-31",
    ]);

    expect(milestoneService.create).toHaveBeenCalledWith("owner/repo", {
      title: "v2.10.0",
      due: "2026-12-31",
    });
  });

  it("list calls service with status option", async () => {
    const program = new Command();
    program.exitOverride();
    milestoneCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "milestone",
      "list",
      "--status",
      "closed",
    ]);

    expect(milestoneService.list).toHaveBeenCalledWith("owner/repo", {
      status: "closed",
    });
  });

  it("list defaults status to open", async () => {
    const program = new Command();
    program.exitOverride();
    milestoneCommand.register(program);

    await program.parseAsync(["node", "test", "milestone", "list"]);
    expect(milestoneService.list).toHaveBeenCalledWith("owner/repo", {
      status: "open",
    });
  });

  it("close calls service with milestone name", async () => {
    const program = new Command();
    program.exitOverride();
    milestoneCommand.register(program);

    await program.parseAsync(["node", "test", "milestone", "close", "v2.10.0"]);
    expect(milestoneService.close).toHaveBeenCalledWith(
      "owner/repo",
      "v2.10.0",
    );
  });

  it("progress calls service with milestone name", async () => {
    const program = new Command();
    program.exitOverride();
    milestoneCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "milestone",
      "progress",
      "v2.10.0",
    ]);

    expect(milestoneService.progress).toHaveBeenCalledWith(
      "owner/repo",
      "v2.10.0",
    );
  });
});
