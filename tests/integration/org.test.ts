import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import orgCommand from "@/commands/org";

vi.mock("@/services/org", () => ({
  default: {
    add: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    list: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
    remove: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

import orgService from "@/services/org";

describe("integration > org commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("members calls service.list with --org option", async () => {
    const program = new Command();
    program.exitOverride();
    orgCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "org",
      "members",
      "--org",
      "airscripts",
    ]);

    expect(orgService.list).toHaveBeenCalledWith("airscripts");
    expect(orgService.list).toHaveBeenCalledTimes(1);
  });

  it("invite calls service.add with all options", async () => {
    const program = new Command();
    program.exitOverride();
    orgCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "org",
      "invite",
      "--org",
      "airscripts",
      "--user",
      "octocat",
      "--role",
      "admin",
    ]);

    expect(orgService.add).toHaveBeenCalledWith(
      "airscripts",
      "octocat",
      "admin",
    );
  });

  it("invite defaults role to member", async () => {
    const program = new Command();
    program.exitOverride();
    orgCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "org",
      "invite",
      "--org",
      "airscripts",
      "--user",
      "octocat",
    ]);

    expect(orgService.add).toHaveBeenCalledWith(
      "airscripts",
      "octocat",
      "member",
    );
  });

  it("remove calls service.remove with --org and --user", async () => {
    const program = new Command();
    program.exitOverride();
    orgCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "org",
      "remove",
      "--org",
      "airscripts",
      "--user",
      "octocat",
    ]);

    expect(orgService.remove).toHaveBeenCalledWith("airscripts", "octocat");
  });

  it("handles org names with special characters", async () => {
    const program = new Command();
    program.exitOverride();
    orgCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "org",
      "members",
      "--org",
      "hello world",
    ]);

    expect(orgService.list).toHaveBeenCalledWith("hello world");
  });

  it("handles empty member list responses", async () => {
    vi.mocked(orgService.list).mockResolvedValue({
      success: true,
      metadata: [],
    });

    const program = new Command();
    program.exitOverride();
    orgCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "org",
      "members",
      "--org",
      "empty-org",
    ]);

    expect(orgService.list).toHaveBeenCalledWith("empty-org");
  });
});
