import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import repoResolver from "@/core/repo";
import repoCommand from "@/commands/repo";
import { ConfigError } from "@/core/errors";
import inviteService from "@/services/invites";

vi.mock("@/services/invites", () => ({
  default: {
    invite: vi.fn(),
    grant: vi.fn(),
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
  },
}));

vi.mock("@/core/repo", () => ({
  default: {
    resolveRepo: vi.fn(() => Promise.resolve("owner/repo")),
    resolveRepos: vi.fn(() => Promise.resolve(["owner/repo"])),
    resolveRepoSync: vi.fn((repo?: string) => repo || "owner/repo"),
  },
}));

const mockPrompt = await import("@/core/prompt");

describe("repo command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(repoResolver.resolveRepoSync).mockReturnValue("owner/repo");
  });

  it("should register repo with subcommands", () => {
    const program = new Command();
    repoCommand.register(program);

    const cmd = program.commands.find((c) => c.name() === "repo");
    expect(cmd).toBeDefined();

    const subcommands = cmd!.commands.map((c) => c.name());
    expect(subcommands).toContain("invite");
    expect(subcommands).toContain("grant");
  });

  it("should reject invalid --repo format", async () => {
    vi.mocked(repoResolver.resolveRepoSync).mockReturnValue("bad");

    const program = new Command();
    program.exitOverride();
    repoCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "repo", "invite", "--repo", "bad"]),
    ).rejects.toThrow(ConfigError);
  });

  it("should reject missing repo when not resolvable", async () => {
    vi.mocked(repoResolver.resolveRepoSync).mockReturnValue("");

    const program = new Command();
    program.exitOverride();
    repoCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "repo", "invite", "--user", "u"]),
    ).rejects.toThrow(ConfigError);
  });

  it("should reject invalid resolved repo", async () => {
    vi.mocked(repoResolver.resolveRepoSync).mockReturnValue("invalid");

    const program = new Command();
    program.exitOverride();
    repoCommand.register(program);

    await expect(
      program.parseAsync(["node", "test", "repo", "invite", "--user", "u"]),
    ).rejects.toThrow(ConfigError);
  });

  it("should prompt for username when missing", async () => {
    vi.mocked(mockPrompt.default.text).mockResolvedValue("octocat");

    vi.mocked(inviteService.invite).mockResolvedValue({
      success: true,

      metadata: {
        username: "",
        repo: "repo",
        owner: "owner",
        permission: "push",
      },
    });

    const program = new Command();
    program.exitOverride();
    repoCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "repo",
      "invite",
      "--repo",
      "owner/repo",
    ]);

    expect(mockPrompt.default.text).toHaveBeenCalledWith("Username:");
    expect(inviteService.invite).toHaveBeenCalledWith(
      "owner",
      "repo",
      "octocat",
      "push",
    );
  });

  it("should prompt for team slug when missing on grant", async () => {
    vi.mocked(mockPrompt.default.text).mockResolvedValue("ops");
    vi.mocked(inviteService.grant).mockResolvedValue({
      success: true,

      metadata: {
        teamSlug: "",
        repo: "repo",
        owner: "owner",
        permission: "push",
      },
    });

    const program = new Command();
    program.exitOverride();
    repoCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "repo",
      "grant",
      "--repo",
      "owner/repo",
    ]);

    expect(mockPrompt.default.text).toHaveBeenCalledWith("Team slug:");
    expect(inviteService.grant).toHaveBeenCalledWith(
      "owner",
      "repo",
      "ops",
      "push",
    );
  });

  it("should reject invalid --role on invite", async () => {
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
        "owner/repo",
        "--role",
        "bad",
      ]),
    ).rejects.toThrow("Invalid role: bad");
  });

  it("should reject invalid --role on grant", async () => {
    const program = new Command();
    program.exitOverride();
    repoCommand.register(program);

    await expect(
      program.parseAsync([
        "node",
        "test",
        "repo",
        "grant",
        "--repo",
        "owner/repo",
        "--role",
        "bad",
      ]),
    ).rejects.toThrow("Invalid role: bad");
  });
});
