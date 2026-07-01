import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import copilotCommand from "@/commands/copilot";
import copilotService from "@/services/copilot";

vi.mock("@/services/copilot", () => ({
  default: {
    run: vi.fn(() => ({ success: true, output: "" })),
    detect: vi.fn(() => ({
      installed: true,
      path: "/usr/local/bin/github-copilot-cli",
    })),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

describe("copilot command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register copilot command", () => {
    const program = new Command();
    copilotCommand.register(program);

    const copilot = program.commands.find((c) => c.name() === "copilot");
    expect(copilot).toBeDefined();
  });

  it("should call run service with args", async () => {
    (copilotService.run as ReturnType<typeof vi.fn>).mockReturnValue({
      success: true,
      output: "suggestion output",
    });

    const program = new Command();
    program.exitOverride();
    copilotCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "copilot",
      "suggest",
      "list files",
    ]);

    expect(copilotService.run).toHaveBeenCalledWith(["suggest", "list files"]);
  });

  it("should call run service with empty args when none provided", async () => {
    (copilotService.run as ReturnType<typeof vi.fn>).mockReturnValue({
      success: true,
      output: "",
    });

    const program = new Command();
    program.exitOverride();
    copilotCommand.register(program);

    await program.parseAsync(["node", "test", "copilot"]);

    expect(copilotService.run).toHaveBeenCalledWith([]);
  });
});
