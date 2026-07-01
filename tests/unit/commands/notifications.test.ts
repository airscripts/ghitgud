import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import service from "@/services/notifications";
import notificationsCommand from "@/commands/inbox-notifications";

vi.mock("@/core/repo", () => ({
  default: {
    resolveRepo: vi.fn().mockResolvedValue("airscripts/gitfleet"),
    resolveRepoSync: vi.fn().mockReturnValue("airscripts/gitfleet"),
    resolveRepos: vi.fn().mockResolvedValue(["airscripts/gitfleet"]),
  },
}));

vi.mock("@/services/notifications", () => ({
  default: {
    list: vi.fn(),
    markRead: vi.fn(),
    markDone: vi.fn(),
  },
}));

vi.mock("@/services/repos/index", () => ({
  default: {
    resolveTargets: vi
      .fn()
      .mockResolvedValue([
        { fullName: "airscripts/gitfleet", name: "gitfleet" },
      ]),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

describe("notifications command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register notifications with subcommands", () => {
    const program = new Command();
    notificationsCommand.register(program);

    const notifications = program.commands[0]?.commands.find(
      (c) => c.name() === "notifications",
    );

    expect(notifications).toBeDefined();
    const subcommands = notifications!.commands.map((c) => c.name());
    expect(subcommands).toContain("list");
    expect(subcommands).toContain("list-by-target");
    expect(subcommands).toContain("read");
    expect(subcommands).toContain("done");
  });

  it("should reject invalid limits before calling service", async () => {
    const program = new Command();
    program.exitOverride();
    notificationsCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "inbox",
        "notifications",
        "list",
        "--limit",
        "10abc",
      ]),
    ).rejects.toThrow("Invalid limit: 10abc.");

    expect(service.list).not.toHaveBeenCalled();
  });
});
