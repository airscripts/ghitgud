import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import notificationsCommand from "@/commands/notifications";

vi.mock("@/services/notifications", () => ({
  default: {
    list: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
    markRead: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    markDone: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

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
      "notifications",
      "list",
      "-a",
      "-p",
      "-r",
      "airscripts/ghitgud",
      "-l",
      "50",
    ]);

    expect(service.list).toHaveBeenCalledWith({
      all: true,
      limit: 50,
      participating: true,
      repo: "airscripts/ghitgud",
    });
  });

  it("read calls service with notification id", async () => {
    const program = new Command();
    program.exitOverride();
    notificationsCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
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
      "notifications",
      "done",
      "12345",
    ]);

    expect(service.markDone).toHaveBeenCalledWith("12345");
  });
});
