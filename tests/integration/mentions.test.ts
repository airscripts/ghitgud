import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import mentionsCommand from "@/commands/mentions";

vi.mock("@/core/repo", () => ({
  default: {
    resolveRepo: vi.fn((repo?: string) =>
      Promise.resolve(repo ?? "airscripts/ghitgud"),
    ),
  },
}));

vi.mock("@/services/notifications", () => ({
  default: {
    mentions: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
  },
}));

import repoResolver from "@/core/repo";
import service from "@/services/notifications";

describe("integration > mentions command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls service.mentions on parse", async () => {
    const program = new Command();
    program.exitOverride();
    mentionsCommand.register(program);

    await program.parseAsync(["node", "test", "mentions"]);
    expect(repoResolver.resolveRepo).not.toHaveBeenCalled();
    expect(service.mentions).toHaveBeenCalledWith(undefined);
  });

  it("passes explicit repo to resolver", async () => {
    const program = new Command();
    program.exitOverride();
    mentionsCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "mentions",
      "--repo",
      "owner/repo",
    ]);

    expect(repoResolver.resolveRepo).toHaveBeenCalledWith("owner/repo");
    expect(service.mentions).toHaveBeenCalledWith("owner/repo");
  });
});
