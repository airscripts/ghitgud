import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import notificationsCommand from "@/commands/inbox-notifications";

vi.mock("@/core/repo", () => ({
  default: {
    resolveRepo: vi.fn((repo?: string) =>
      Promise.resolve(repo ?? "airscripts/gitfleet"),
    ),

    resolveRepoSync: vi.fn(() => "airscripts/gitfleet"),
    resolveRepos: vi.fn(() => Promise.resolve(["airscripts/gitfleet"])),
  },
}));

vi.mock("@/services/notifications", () => ({
  default: {
    list: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
    markRead: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    markDone: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

vi.mock("@/services/repos/index", () => ({
  default: {
    resolveTargets: vi.fn(() =>
      Promise.resolve([{ fullName: "airscripts/gitfleet", name: "gitfleet" }]),
    ),
  },
}));

import repoResolver from "@/core/repo";
import service from "@/services/notifications";

describe("integration > notifications commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list calls service with filter options", async () => {
    const program = new Command();
    program.exitOverride();
    notificationsCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "inbox",
      "notifications",
      "list",
      "-a",
      "-p",
      "-r",
      "airscripts/gitfleet",
      "-l",
      "50",
    ]);

    expect(repoResolver.resolveRepo).toHaveBeenCalledWith(
      "airscripts/gitfleet",
    );
    expect(service.list).toHaveBeenCalledWith({
      all: true,
      limit: 50,
      participating: true,
      repo: "airscripts/gitfleet",
    });
  });

  it("list passes undefined repo when repo is omitted", async () => {
    const program = new Command();
    program.exitOverride();
    notificationsCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "inbox",
      "notifications",
      "list",
    ]);

    expect(repoResolver.resolveRepo).not.toHaveBeenCalled();
    expect(service.list).toHaveBeenCalledWith({
      all: undefined,
      limit: undefined,
      participating: undefined,
      repo: undefined,
    });
  });

  it("read calls service with notification id", async () => {
    const program = new Command();
    program.exitOverride();
    notificationsCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "inbox",
      "notifications",
      "read",
      "12345",
    ]);

    expect(service.markRead).toHaveBeenCalledWith("12345");
  });

  it("done calls service with notification id", async () => {
    const program = new Command();
    program.exitOverride();
    notificationsCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "inbox",
      "notifications",
      "done",
      "12345",
    ]);

    expect(service.markDone).toHaveBeenCalledWith("12345");
  });
});
