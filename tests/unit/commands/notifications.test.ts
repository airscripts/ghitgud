import { Command } from "commander";
import { describe, it, expect } from "vitest";
import notificationsCommand from "@/commands/notifications";

describe("notifications command", () => {
  it("should register notifications with subcommands", () => {
    const program = new Command();
    notificationsCommand.register(program);

    const notifications = program.commands.find(
      (c) => c.name() === "notifications",
    );

    expect(notifications).toBeDefined();
    const subcommands = notifications!.commands.map((c) => c.name());
    expect(subcommands).toContain("list");
    expect(subcommands).toContain("read");
    expect(subcommands).toContain("done");
  });
});
