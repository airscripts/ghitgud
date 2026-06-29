import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import searchCommand from "@/commands/search";

vi.mock("@/services/search", () => ({
  default: {
    searchIssues: vi.fn(() =>
      Promise.resolve({ success: true, totalCount: 0, items: [] }),
    ),

    searchPrs: vi.fn(() =>
      Promise.resolve({ success: true, totalCount: 0, items: [] }),
    ),

    searchRepos: vi.fn(() =>
      Promise.resolve({ success: true, totalCount: 0, items: [] }),
    ),

    searchCode: vi.fn(() =>
      Promise.resolve({ success: true, totalCount: 0, items: [] }),
    ),

    searchCommits: vi.fn(() =>
      Promise.resolve({ success: true, totalCount: 0, items: [] }),
    ),
  },
}));

vi.mock("@/core/command", () => ({
  default: {
    run: (task: () => unknown) => task(),
  },
}));

describe("search command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers search command with subcommands", () => {
    const program = new Command();
    searchCommand.register(program);

    const search = program.commands.find((cmd) => cmd.name() === "search");
    expect(search).toBeDefined();

    const subcommands = search!.commands.map((cmd) => cmd.name());
    expect(subcommands).toContain("issues");
    expect(subcommands).toContain("prs");
    expect(subcommands).toContain("repos");
    expect(subcommands).toContain("code");
    expect(subcommands).toContain("commits");
  });
});
