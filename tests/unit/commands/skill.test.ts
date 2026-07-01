import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import skillCommand from "@/commands/skill";
import skillService from "@/services/skill";

vi.mock("@/services/skill", () => ({
  default: {
    install: vi.fn(),
    list: vi.fn(),
    preview: vi.fn(),
    publish: vi.fn(),
    search: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

vi.mock("@/core/prompt", () => ({
  default: {
    text: vi.fn(() => Promise.resolve("owner/repo")),
    isNonInteractive: vi.fn(() => false),
  },
}));

describe("skill command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register skill command with subcommands", () => {
    const program = new Command();
    skillCommand.register(program);

    const skill = program.commands.find((c) => c.name() === "skill");
    expect(skill).toBeDefined();
    const subcommands = skill!.commands.map((c) => c.name());

    expect(subcommands).toContain("install");
    expect(subcommands).toContain("list");
    expect(subcommands).toContain("preview");
    expect(subcommands).toContain("publish");
    expect(subcommands).toContain("search");
    expect(subcommands).toContain("update");
  });

  it("should call install service on skill install", async () => {
    (skillService.install as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      skill: { name: "test" },
    });

    const program = new Command();
    program.exitOverride();
    skillCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "skill",
      "install",
      "owner/repo",
    ]);

    expect(skillService.install).toHaveBeenCalledWith("owner/repo", undefined);
  });

  it("should call list service on skill list", async () => {
    (skillService.list as ReturnType<typeof vi.fn>).mockReturnValue({
      success: true,
      skills: [],
    });

    const program = new Command();
    program.exitOverride();
    skillCommand.register(program);

    await program.parseAsync(["node", "test", "skill", "list"]);

    expect(skillService.list).toHaveBeenCalled();
  });

  it("should call search service on skill search", async () => {
    (skillService.search as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      results: [],
    });

    const program = new Command();
    program.exitOverride();
    skillCommand.register(program);

    await program.parseAsync(["node", "test", "skill", "search", "testing"]);

    expect(skillService.search).toHaveBeenCalledWith("testing");
  });

  it("should call update service on skill update", async () => {
    (skillService.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      updated: [],
    });

    const program = new Command();
    program.exitOverride();
    skillCommand.register(program);

    await program.parseAsync(["node", "test", "skill", "update"]);

    expect(skillService.update).toHaveBeenCalledWith(undefined);
  });
});
