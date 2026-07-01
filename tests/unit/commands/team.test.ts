import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import teamCommand from "@/commands/access-team";

vi.mock("@/services/team", () => ({
  default: {
    list: vi.fn(),
    create: vi.fn(),
    addMember: vi.fn(),
    removeMember: vi.fn(),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

vi.mock("@/core/prompt", () => ({
  default: {
    text: vi.fn((message: string) => {
      if (message.includes("Team description")) return "A team";
      return "";
    }),

    select: vi.fn(),
    confirm: vi.fn(),
    multiSelect: vi.fn(),
    promptIfMissing: vi.fn(),
    guardNonInteractive: vi.fn(),
  },
}));

describe("team command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register team with subcommands", () => {
    const program = new Command();
    teamCommand.register(program);

    const cmd = program.commands[0]?.commands.find((c) => c.name() === "team");
    expect(cmd).toBeDefined();

    const subcommands = cmd!.commands.map((c) => c.name());
    expect(subcommands).toContain("list");
    expect(subcommands).toContain("create");
    expect(subcommands).toContain("add");
    expect(subcommands).toContain("remove");
  });

  it("should reject missing org name on team list", async () => {
    const program = new Command();
    program.exitOverride();
    teamCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "access", "team", "list"]),
    ).rejects.toThrow("Organization name is required.");
  });

  it("should reject blank org name on team list", async () => {
    const program = new Command();
    program.exitOverride();
    teamCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "access",
        "team",
        "list",
        "--org",
        "   ",
      ]),
    ).rejects.toThrow("Organization name is required.");
  });

  it("should reject missing org name on team create", async () => {
    const program = new Command();
    program.exitOverride();
    teamCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "access",
        "team",
        "create",
        "--name",
        "ops",
      ]),
    ).rejects.toThrow("Organization name is required.");
  });

  it("should reject missing team name on team create", async () => {
    const program = new Command();
    program.exitOverride();
    teamCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "access",
        "team",
        "create",
        "--org",
        "airscripts",
      ]),
    ).rejects.toThrow("Team name is required.");
  });

  it("should reject blank org name on team add", async () => {
    const program = new Command();
    program.exitOverride();
    teamCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "access",
        "team",
        "add",
        "--team",
        "ops",
        "--user",
        "octocat",
      ]),
    ).rejects.toThrow("Organization name is required.");
  });

  it("should reject missing team slug on team add", async () => {
    const program = new Command();
    program.exitOverride();
    teamCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "access",
        "team",
        "add",
        "--org",
        "airscripts",
        "--user",
        "octocat",
      ]),
    ).rejects.toThrow("Team slug is required.");
  });

  it("should reject missing username on team add", async () => {
    const program = new Command();
    program.exitOverride();
    teamCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "access",
        "team",
        "add",
        "--org",
        "airscripts",
        "--team",
        "ops",
      ]),
    ).rejects.toThrow("Username is required.");
  });

  it("should reject blank org name on team remove", async () => {
    const program = new Command();
    program.exitOverride();
    teamCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "access",
        "team",
        "remove",
        "--team",
        "ops",
        "--user",
        "octocat",
      ]),
    ).rejects.toThrow("Organization name is required.");
  });

  it("should reject missing team slug on team remove", async () => {
    const program = new Command();
    program.exitOverride();
    teamCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "access",
        "team",
        "remove",
        "--org",
        "airscripts",
        "--user",
        "octocat",
      ]),
    ).rejects.toThrow("Team slug is required.");
  });

  it("should reject missing username on team remove", async () => {
    const program = new Command();
    program.exitOverride();
    teamCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "access",
        "team",
        "remove",
        "--org",
        "airscripts",
        "--team",
        "ops",
      ]),
    ).rejects.toThrow("Username is required.");
  });
});
