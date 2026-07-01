import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import repoCommand from "@/commands/repo";

vi.mock("@/core/repo", () => ({
  default: {
    resolveRepo: vi.fn(() => Promise.resolve("airscripts/gitfleet")),
    resolveRepoSync: vi.fn((repo?: string) => repo || "airscripts/gitfleet"),
  },
}));

vi.mock("@/services/invites", () => ({
  default: {
    invite: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    grant: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

import inviteService from "@/services/invites";

describe("integration > repo commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invite calls inviteService.invite with parsed repo", async () => {
    const program = new Command();
    program.exitOverride();
    repoCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "repo",
      "invite",
      "--repo",
      "airscripts/gitfleet",
      "--user",
      "octocat",
      "--role",
      "push",
    ]);

    expect(inviteService.invite).toHaveBeenCalledWith(
      "airscripts",
      "gitfleet",
      "octocat",
      "push",
    );
  });

  it("invite defaults role to push", async () => {
    const program = new Command();
    program.exitOverride();
    repoCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "repo",
      "invite",
      "--repo",
      "airscripts/gitfleet",
      "--user",
      "octocat",
    ]);

    expect(inviteService.invite).toHaveBeenCalledWith(
      "airscripts",
      "gitfleet",
      "octocat",
      "push",
    );
  });

  it("invite uses configured repo when --repo is omitted", async () => {
    const program = new Command();
    program.exitOverride();
    repoCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "repo",
      "invite",
      "--user",
      "octocat",
    ]);

    expect(inviteService.invite).toHaveBeenCalledWith(
      "airscripts",
      "gitfleet",
      "octocat",
      "push",
    );
  });

  it("grant calls inviteService.grant with parsed repo", async () => {
    const program = new Command();
    program.exitOverride();
    repoCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "repo",
      "grant",
      "--repo",
      "airscripts/gitfleet",
      "--team",
      "platform",
      "--role",
      "admin",
    ]);

    expect(inviteService.grant).toHaveBeenCalledWith(
      "airscripts",
      "gitfleet",
      "platform",
      "admin",
    );
  });

  it("grant defaults role to push", async () => {
    const program = new Command();
    program.exitOverride();
    repoCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "repo",
      "grant",
      "--repo",
      "airscripts/gitfleet",
      "--team",
      "platform",
    ]);

    expect(inviteService.grant).toHaveBeenCalledWith(
      "airscripts",
      "gitfleet",
      "platform",
      "push",
    );
  });

  it("rejects invalid repo format", async () => {
    const program = new Command();
    program.exitOverride();
    repoCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "repo",
        "invite",
        "--repo",
        "invalid-repo-format",
        "--user",
        "octocat",
      ]),
    ).rejects.toThrow(
      "Invalid repository: invalid-repo-format. Expected: owner/repo",
    );
  });
});
