import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import teamCommand from "@/commands/access-team";

vi.mock("@/services/team", () => ({
  default: {
    list: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
    create: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    addMember: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    listMembers: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
    removeMember: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

import teamService from "@/services/team";

describe("integration > team commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list calls service.list with --org", async () => {
    const program = new Command();
    program.exitOverride();
    teamCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "access",
      "team",
      "list",
      "--org",
      "airscripts",
    ]);

    expect(teamService.list).toHaveBeenCalledWith("airscripts");
  });

  it("create calls service.create with all options", async () => {
    const program = new Command();
    program.exitOverride();
    teamCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "access",
      "team",
      "create",
      "--org",
      "airscripts",
      "--name",
      "ops",
      "--description",
      "Platform team",
      "--privacy",
      "secret",
    ]);

    expect(teamService.create).toHaveBeenCalledWith(
      "airscripts",
      "ops",
      "Platform team",
      "secret",
    );
  });

  it("create defaults privacy to secret", async () => {
    const program = new Command();
    program.exitOverride();
    teamCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "access",
      "team",
      "create",
      "--org",
      "airscripts",
      "--name",
      "ops",
      "--description",
      "Team desc",
    ]);

    expect(teamService.create).toHaveBeenCalledWith(
      "airscripts",
      "ops",
      "Team desc",
      "secret",
    );
  });

  it("add calls service.addMember with all options", async () => {
    const program = new Command();
    program.exitOverride();
    teamCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "access",
      "team",
      "add",
      "--org",
      "airscripts",
      "--team",
      "ops",
      "--user",
      "octocat",
      "--role",
      "maintainer",
    ]);

    expect(teamService.addMember).toHaveBeenCalledWith(
      "airscripts",
      "ops",
      "octocat",
      "maintainer",
    );
  });

  it("add defaults role to member", async () => {
    const program = new Command();
    program.exitOverride();
    teamCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "access",
      "team",
      "add",
      "--org",
      "airscripts",
      "--team",
      "ops",
      "--user",
      "octocat",
    ]);

    expect(teamService.addMember).toHaveBeenCalledWith(
      "airscripts",
      "ops",
      "octocat",
      "member",
    );
  });

  it("remove calls service.removeMember with all options", async () => {
    const program = new Command();
    program.exitOverride();
    teamCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "access",
      "team",
      "remove",
      "--org",
      "airscripts",
      "--team",
      "ops",
      "--user",
      "octocat",
    ]);

    expect(teamService.removeMember).toHaveBeenCalledWith(
      "airscripts",
      "ops",
      "octocat",
    );
  });

  it("handles empty team list responses", async () => {
    vi.mocked(teamService.list).mockResolvedValue({
      success: true,
      metadata: [],
    });

    const program = new Command();
    program.exitOverride();
    teamCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "access",
      "team",
      "list",
      "--org",
      "empty-org",
    ]);

    expect(teamService.list).toHaveBeenCalledWith("empty-org");
  });
});
