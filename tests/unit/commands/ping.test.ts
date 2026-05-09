import { Command } from "commander";
import pingCommand from "@/commands/ping";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/services/labels", () => ({
  default: {
    list: vi.fn(),
    pull: vi.fn(),
    push: vi.fn(),
    prune: vi.fn(),
    pullTemplate: vi.fn(),
    pushTemplate: vi.fn(),
    ping: vi.fn(() => ({ success: true, message: "pong" })),
  },
}));

describe("ping command", () => {
  it("should register ping command on program", () => {
    const program = new Command();
    pingCommand.register(program);
    const commands = program.commands.map((c) => c.name());
    expect(commands).toContain("ping");
  });
});