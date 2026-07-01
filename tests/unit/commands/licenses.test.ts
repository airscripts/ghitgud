import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import licensesCommand from "@/commands/licenses";
import licensesService from "@/services/licenses";

vi.mock("@/services/licenses", () => ({
  default: {
    list: vi.fn(),
    view: vi.fn(),
    repoList: vi.fn(),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

describe("licenses command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register licenses command with subcommands", () => {
    const program = new Command();
    licensesCommand.register(program);

    const licenses = program.commands.find((c) => c.name() === "licenses");
    expect(licenses).toBeDefined();
    const subcommands = licenses!.commands.map((c) => c.name());

    expect(subcommands).toContain("list");
    expect(subcommands).toContain("view");
  });

  it("should call list service on licenses list", async () => {
    (licensesService.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      licenses: [],
    });

    const program = new Command();
    program.exitOverride();
    licensesCommand.register(program);

    await program.parseAsync(["node", "test", "licenses", "list"]);

    expect(licensesService.list).toHaveBeenCalled();
  });

  it("should call view service on licenses view with key", async () => {
    (licensesService.view as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      license: { key: "mit", name: "MIT License" },
    });

    const program = new Command();
    program.exitOverride();
    licensesCommand.register(program);

    await program.parseAsync(["node", "test", "licenses", "view", "mit"]);

    expect(licensesService.view).toHaveBeenCalledWith("mit");
  });
});
