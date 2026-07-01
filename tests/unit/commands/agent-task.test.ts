import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import agentTaskCommand from "@/commands/agent-task";
import agentTaskService from "@/services/agent-task";

vi.mock("@/services/agent-task", () => ({
  default: {
    create: vi.fn(),
    list: vi.fn(),
    view: vi.fn(),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

vi.mock("@/core/prompt", () => ({
  default: {
    text: vi.fn(() => Promise.resolve("Describe task")),
    isNonInteractive: vi.fn(() => false),
  },
}));

describe("agent-task command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register agent-task command with subcommands", () => {
    const program = new Command();
    agentTaskCommand.register(program);

    const agentTask = program.commands.find((c) => c.name() === "agent-task");
    expect(agentTask).toBeDefined();
    const subcommands = agentTask!.commands.map((c) => c.name());

    expect(subcommands).toContain("create");
    expect(subcommands).toContain("list");
    expect(subcommands).toContain("view");
  });

  it("should call list service on agent-task list", async () => {
    (agentTaskService.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      tasks: [],
    });

    const program = new Command();
    program.exitOverride();
    agentTaskCommand.register(program);

    await program.parseAsync(["node", "test", "agent-task", "list"]);

    expect(agentTaskService.list).toHaveBeenCalledWith(undefined);
  });

  it("should call list service with repo option", async () => {
    (agentTaskService.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      tasks: [],
    });

    const program = new Command();
    program.exitOverride();
    agentTaskCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "agent-task",
      "list",
      "--repo",
      "owner/repo",
    ]);

    expect(agentTaskService.list).toHaveBeenCalledWith("owner/repo");
  });

  it("should call view service on agent-task view", async () => {
    (agentTaskService.view as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      task: { id: "task-123" },
    });

    const program = new Command();
    program.exitOverride();
    agentTaskCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "agent-task",
      "view",
      "task-123",
    ]);

    expect(agentTaskService.view).toHaveBeenCalledWith("task-123", undefined);
  });
});
