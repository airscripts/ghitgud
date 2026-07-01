import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import previewCommand from "@/commands/preview";
import previewService from "@/services/preview";

vi.mock("@/services/preview", () => ({
  default: {
    prompter: vi.fn(() =>
      Promise.resolve({ success: true, preview: { text: "result" } }),
    ),
    PROMPT_TYPES: ["text", "select", "confirm", "multiselect", "password"],
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

describe("preview command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register preview command with subcommands", () => {
    const program = new Command();
    previewCommand.register(program);

    const preview = program.commands.find((c) => c.name() === "preview");
    expect(preview).toBeDefined();
    const subcommands = preview!.commands.map((c) => c.name());

    expect(subcommands).toContain("prompter");
  });

  it("should call prompter service with no type", async () => {
    (previewService.prompter as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      preview: {},
    });

    const program = new Command();
    program.exitOverride();
    previewCommand.register(program);

    await program.parseAsync(["node", "test", "preview", "prompter"]);

    expect(previewService.prompter).toHaveBeenCalledWith(undefined);
  });

  it("should call prompter service with type", async () => {
    (previewService.prompter as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      preview: { text: "result" },
    });

    const program = new Command();
    program.exitOverride();
    previewCommand.register(program);

    await program.parseAsync(["node", "test", "preview", "prompter", "text"]);

    expect(previewService.prompter).toHaveBeenCalledWith("text");
  });
});
