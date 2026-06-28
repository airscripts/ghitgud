import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import orgCommand from "@/commands/org";

vi.mock("@/services/org", () => ({
  default: {
    add: vi.fn(),
    list: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
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

describe("org command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register org with subcommands", () => {
    const program = new Command();
    orgCommand.register(program);

    const cmd = program.commands.find((c) => c.name() === "org");
    expect(cmd).toBeDefined();

    const subcommands = cmd!.commands.map((c) => c.name());
    expect(subcommands).toContain("members");
    expect(subcommands).toContain("invite");
    expect(subcommands).toContain("remove");
  });

  it("should reject missing org name on org members", async () => {
    const program = new Command();
    program.exitOverride();
    orgCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "org", "members"]),
    ).rejects.toThrow("Organization name is required.");
  });

  it("should reject blank org name on org members", async () => {
    const program = new Command();
    program.exitOverride();
    orgCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "org", "members", "--org", "   "]),
    ).rejects.toThrow("Organization name is required.");
  });

  it("should reject missing org name on org invite", async () => {
    const program = new Command();
    program.exitOverride();
    orgCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "org",
        "invite",
        "--user",
        "octocat",
      ]),
    ).rejects.toThrow("Organization name is required.");
  });

  it("should reject missing username on org invite", async () => {
    const program = new Command();
    program.exitOverride();
    orgCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "org",
        "invite",
        "--org",
        "airscripts",
      ]),
    ).rejects.toThrow("Username is required.");
  });

  it("should reject missing org name on org remove", async () => {
    const program = new Command();
    program.exitOverride();
    orgCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "org",
        "remove",
        "--user",
        "octocat",
      ]),
    ).rejects.toThrow("Organization name is required.");
  });

  it("should reject missing username on org remove", async () => {
    const program = new Command();
    program.exitOverride();
    orgCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "org",
        "remove",
        "--org",
        "airscripts",
      ]),
    ).rejects.toThrow("Username is required.");
  });
});
