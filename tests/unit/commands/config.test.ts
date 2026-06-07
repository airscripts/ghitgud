import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import configCommand from "@/commands/config";

vi.mock("@/services/config", () => ({
  default: {
    read: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    unset: vi.fn(),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

vi.mock("@/core/prompt", () => ({
  default: {
    text: vi.fn(),
    select: vi.fn(),
  },
}));

const mockPrompt = await import("@/core/prompt");
const mockConfig = await import("@/services/config");

describe("config command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register config command with subcommands", () => {
    const program = new Command();
    configCommand.register(program);
    const config = program.commands.find((c) => c.name() === "config");

    expect(config).toBeDefined();
    const subcommands = config!.commands.map((c) => c.name());
    expect(subcommands).toContain("set");
    expect(subcommands).toContain("get");
    expect(subcommands).toContain("unset");
  });

  it("should prompt for key and value on set when missing", async () => {
    vi.mocked(mockPrompt.default.select).mockResolvedValue("repo");
    vi.mocked(mockPrompt.default.text).mockResolvedValue("owner/repo");
    vi.mocked(mockConfig.default.read).mockReturnValue("");

    const program = new Command();
    program.exitOverride();
    configCommand.register(program);

    await program.parseAsync(["node", "test", "config", "set"]);

    expect(mockPrompt.default.select).toHaveBeenCalled();
    expect(mockPrompt.default.text).toHaveBeenCalledWith(
      "Enter value for repo:",
      expect.objectContaining({ placeholder: "owner/repo" }),
    );
    expect(mockConfig.default.set).toHaveBeenCalledWith("repo", "owner/repo");
  });

  it("should prompt for key on set when only value is provided", async () => {
    vi.mocked(mockPrompt.default.select).mockResolvedValue("repo");
    vi.mocked(mockConfig.default.read).mockReturnValue("");

    const program = new Command();
    program.exitOverride();
    configCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "config",
      "set",
      "",
      "owner/repo",
    ]);

    expect(mockPrompt.default.select).toHaveBeenCalled();
  });

  it("should prompt for key on get when missing", async () => {
    vi.mocked(mockPrompt.default.select).mockResolvedValue("repo");

    vi.mocked(mockConfig.default.get).mockReturnValue({
      key: "repo",
      value: null,
      success: true,
    });

    const program = new Command();
    program.exitOverride();
    configCommand.register(program);

    await program.parseAsync(["node", "test", "config", "get"]);

    expect(mockPrompt.default.select).toHaveBeenCalled();
    expect(mockConfig.default.get).toHaveBeenCalledWith("repo");
  });

  it("should prompt for key on unset when missing", async () => {
    vi.mocked(mockPrompt.default.select).mockResolvedValue("repo");

    const program = new Command();
    program.exitOverride();
    configCommand.register(program);

    await program.parseAsync(["node", "test", "config", "unset"]);

    expect(mockPrompt.default.select).toHaveBeenCalled();
    expect(mockConfig.default.unset).toHaveBeenCalledWith("repo");
  });

  it("should not leak token in placeholder for token key", async () => {
    vi.mocked(mockPrompt.default.select).mockResolvedValue("token");
    vi.mocked(mockPrompt.default.text).mockResolvedValue("ghp_new");
    vi.mocked(mockConfig.default.read).mockReturnValue("ghp_oldsecret");

    const program = new Command();
    program.exitOverride();
    configCommand.register(program);

    await program.parseAsync(["node", "test", "config", "set"]);

    expect(mockPrompt.default.text).toHaveBeenCalledWith(
      "Enter value for token:",
      expect.objectContaining({ placeholder: "ghp_xxxxxxxxxxxx" }),
    );
  });

  it("should show truncated initialValue for non-token keys", async () => {
    vi.mocked(mockPrompt.default.select).mockResolvedValue("repo");
    vi.mocked(mockPrompt.default.text).mockResolvedValue("new/repo");
    vi.mocked(mockConfig.default.read).mockReturnValue("old/repo");

    const program = new Command();
    program.exitOverride();
    configCommand.register(program);

    await program.parseAsync(["node", "test", "config", "set"]);

    expect(mockPrompt.default.text).toHaveBeenCalledWith(
      "Enter value for repo:",
      expect.objectContaining({ initialValue: "old/..." }),
    );
  });
});
