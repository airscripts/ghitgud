import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import repoCommand from "@/commands/repo";

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

describe("repo command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
