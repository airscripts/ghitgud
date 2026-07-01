import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import aliasCommand from "@/commands/alias";
import aliasService from "@/services/alias";

vi.mock("@/services/alias", () => ({
  default: {
    set: vi.fn(),
    list: vi.fn(),
    deleteAlias: vi.fn(),
    importAliases: vi.fn(),
    resolve: vi.fn(),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

vi.mock("@/core/prompt", () => ({
  default: {
    isNonInteractive: vi.fn(() => false),
    text: vi.fn(() => Promise.resolve("/path/to/file")),
  },
}));

describe("alias command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register alias command with subcommands", () => {
    const program = new Command();
    aliasCommand.register(program);

    const alias = program.commands.find((c) => c.name() === "alias");
    expect(alias).toBeDefined();
    const subcommands = alias!.commands.map((c) => c.name());

    expect(subcommands).toContain("set");
    expect(subcommands).toContain("list");
    expect(subcommands).toContain("delete");
    expect(subcommands).toContain("import");
  });

  it("should call set service on alias set", async () => {
    (aliasService.set as ReturnType<typeof vi.fn>).mockReturnValue({
      success: true,
      name: "co",
      expansion: "checkout",
    });

    const program = new Command();
    program.exitOverride();
    aliasCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "alias",
      "set",
      "co",
      "checkout",
    ]);

    expect(aliasService.set).toHaveBeenCalledWith("co", "checkout", false);
  });

  it("should call set service with force flag", async () => {
    (aliasService.set as ReturnType<typeof vi.fn>).mockReturnValue({
      success: true,
      name: "co",
      expansion: "checkout",
    });

    const program = new Command();
    program.exitOverride();
    aliasCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "alias",
      "set",
      "co",
      "checkout",
      "--force",
    ]);

    expect(aliasService.set).toHaveBeenCalledWith("co", "checkout", true);
  });

  it("should call list service on alias list", async () => {
    (aliasService.list as ReturnType<typeof vi.fn>).mockReturnValue({
      success: true,
      aliases: [],
    });

    const program = new Command();
    program.exitOverride();
    aliasCommand.register(program);

    await program.parseAsync(["node", "test", "alias", "list"]);

    expect(aliasService.list).toHaveBeenCalled();
  });

  it("should call deleteAlias service on alias delete", async () => {
    (aliasService.deleteAlias as ReturnType<typeof vi.fn>).mockReturnValue({
      success: true,
      name: "co",
    });

    const program = new Command();
    program.exitOverride();
    aliasCommand.register(program);

    await program.parseAsync(["node", "test", "alias", "delete", "co"]);

    expect(aliasService.deleteAlias).toHaveBeenCalledWith("co");
  });

  it("should call importAliases service on alias import with file", async () => {
    (aliasService.importAliases as ReturnType<typeof vi.fn>).mockReturnValue({
      success: true,
      imported: 2,
    });

    const program = new Command();
    program.exitOverride();
    aliasCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "alias",
      "import",
      "/path/to/file",
    ]);

    expect(aliasService.importAliases).toHaveBeenCalledWith("/path/to/file");
  });
});
