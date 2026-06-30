import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import cacheCommand from "@/commands/cache";

vi.mock("@/services/cache", () => ({
  default: {
    inspect: vi.fn(),
    download: vi.fn(),
    list: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

vi.mock("@/core/repo", () => ({
  default: {
    resolveRepo: vi.fn(() => Promise.resolve("owner/repo")),
  },
}));

vi.mock("@/core/prompt", () => ({
  default: {
    select: vi.fn(),
    confirm: vi.fn(),
    multiSelect: vi.fn(),
    text: vi.fn(() => ""),
    promptIfMissing: vi.fn(),
    guardNonInteractive: vi.fn(),
  },
}));

describe("cache command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register cache command with subcommands", () => {
    const program = new Command();
    cacheCommand.register(program);

    const cache = program.commands.find(
      (command) => command.name() === "cache",
    );

    expect(cache).toBeDefined();
    const subcommands = cache!.commands.map((command) => command.name());
    expect(subcommands).toContain("inspect");
    expect(subcommands).toContain("download");
    expect(subcommands).toContain("list");
    expect(subcommands).toContain("delete");
  });

  it("should reject missing cache key on inspect", async () => {
    const program = new Command();
    program.exitOverride();
    cacheCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "cache", "inspect"]),
    ).rejects.toThrow("Cache key is required.");
  });

  it("should reject blank cache key on inspect", async () => {
    const program = new Command();
    program.exitOverride();
    cacheCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "cache", "inspect", "   "]),
    ).rejects.toThrow("Cache key is required.");
  });

  it("should reject missing cache key on download", async () => {
    const program = new Command();
    program.exitOverride();
    cacheCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "cache", "download"]),
    ).rejects.toThrow("Cache key is required.");
  });

  it("should reject blank cache key on download", async () => {
    const program = new Command();
    program.exitOverride();
    cacheCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "cache", "download", "   "]),
    ).rejects.toThrow("Cache key is required.");
  });
});
