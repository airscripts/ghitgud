import { Command } from "commander";
import tuiCommand from "@/commands/tui";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/tui", () => ({
  default: {
    start: vi.fn(() => Promise.resolve({ success: true })),
  },
}));

describe("tui command", () => {
  it("should register tui command on program", () => {
    const program = new Command();
    tuiCommand.register(program);

    const commands = program.commands.map((command) => command.name());
    expect(commands).toContain("tui");
  });
});
