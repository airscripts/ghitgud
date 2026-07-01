import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import authCommand from "@/commands/auth";

vi.mock("@/services/auth", () => ({
  default: {
    list: vi.fn(),
    login: vi.fn(),
    token: vi.fn(),
    logout: vi.fn(),
    status: vi.fn(),
    switch: vi.fn(),
    detect: vi.fn(),
    setupGit: vi.fn(),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

vi.mock("@/core/config", () => ({
  default: {
    listProfiles: vi.fn(() => []),
    getTokenOptional: vi.fn(() => "ghp_test"),
  },
}));

vi.mock("@/core/prompt", () => ({
  default: {
    select: vi.fn((_: string, options: { value: string; label: string }[]) => {
      return Promise.resolve(options[0]?.value ?? "");
    }),

    text: vi.fn(() => ""),
    promptIfMissing: vi.fn(),
    guardNonInteractive: vi.fn(),
    confirm: vi.fn(() => Promise.resolve(true)),
  },
}));

describe("auth command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register auth command with subcommands", () => {
    const program = new Command();
    authCommand.register(program);

    const auth = program.commands.find((c) => c.name() === "auth");
    expect(auth).toBeDefined();

    const subcommands = auth!.commands.map((c) => c.name());
    expect(subcommands).toContain("login");
    expect(subcommands).toContain("logout");
    expect(subcommands).toContain("status");
    expect(subcommands).toContain("token");
    expect(subcommands).toContain("list");
    expect(subcommands).toContain("switch");
    expect(subcommands).toContain("detect");
    expect(subcommands).toContain("setup-git");
  });

  it("should register setup-git subcommand", () => {
    const program = new Command();
    authCommand.register(program);

    const auth = program.commands.find((c) => c.name() === "auth");
    const setupGit = auth!.commands.find((c) => c.name() === "setup-git");

    expect(setupGit).toBeDefined();
  });

  it("status subcommand should have --show-token option", () => {
    const program = new Command();
    authCommand.register(program);

    const auth = program.commands.find((c) => c.name() === "auth");
    const status = auth!.commands.find((c) => c.name() === "status");

    expect(status).toBeDefined();
    const optionFlags = status!.options.map((o) => o.long);
    expect(optionFlags).toContain("--show-token");
  });

  it("should reject login without token in non-interactive mode", async () => {
    const program = new Command();
    program.exitOverride();
    authCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "auth", "login"]),
    ).rejects.toThrow("No token found.");
  });

  it("should reject logout without token", async () => {
    const { default: config } = await import("@/core/config");
    (config.getTokenOptional as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const program = new Command();
    program.exitOverride();
    authCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "auth", "logout"]),
    ).rejects.toThrow("No token found.");
  });
});
