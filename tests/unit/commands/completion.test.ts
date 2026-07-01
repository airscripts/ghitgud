import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import completionCommand from "@/commands/completion";
import completionService from "@/services/completion";

vi.mock("@/services/completion", () => ({
  default: {
    generate: vi.fn(() => "# completion script"),
    listShells: vi.fn(() => ({ success: true, shells: ["bash"] })),
    getCompletion: vi.fn(() => ({ success: true, shell: "bash", script: "#" })),
    VALID_SHELLS: ["bash", "zsh", "fish", "powershell"],
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

describe("completion command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register completion command with subcommands", () => {
    const program = new Command();
    completionCommand.register(program);

    const completion = program.commands.find((c) => c.name() === "completion");
    expect(completion).toBeDefined();
    const subcommands = completion!.commands.map((c) => c.name());

    expect(subcommands).toContain("generate");
    expect(subcommands).toContain("list");
  });

  it("should call getCompletion on generate with shell", async () => {
    (
      completionService.getCompletion as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      success: true,
      shell: "bash",
      script: "# bash completion",
    });

    const program = new Command();
    program.exitOverride();
    completionCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "completion",
      "generate",
      "--shell",
      "bash",
    ]);

    expect(completionService.getCompletion).toHaveBeenCalledWith(
      "bash",
      expect.any(Array),
    );
  });

  it("should call listShells on completion list", async () => {
    (completionService.listShells as ReturnType<typeof vi.fn>).mockReturnValue({
      success: true,
      shells: ["bash", "zsh"],
    });

    const program = new Command();
    program.exitOverride();
    completionCommand.register(program);

    await program.parseAsync(["node", "test", "completion", "list"]);

    expect(completionService.listShells).toHaveBeenCalled();
  });
});
