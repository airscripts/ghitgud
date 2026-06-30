import { Command } from "commander";
import { describe, expect, it } from "vitest";
import webhookCommand from "@/commands/webhook";

describe("webhook command", () => {
  it("registers the complete webhook lifecycle", () => {
    const program = new Command();
    webhookCommand.register(program);
    const webhook = program.commands.find((item) => item.name() === "webhook");
    expect(webhook).toBeDefined();
    const names = webhook!.commands.map((item) => item.name());
    expect(names).toContain("list");
    expect(names).toContain("create");
    expect(names).toContain("edit");
    expect(names).toContain("delete");
    expect(names).toContain("test");
    expect(names).toContain("delivery");
  });
});
