import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import activityCommand from "@/commands/activity";

vi.mock("@/core/repo", () => ({
  default: {
    resolveRepo: vi.fn((repo?: string) =>
      Promise.resolve(repo ?? "airscripts/ghitgud"),
    ),
  },
}));

vi.mock("@/services/notifications", () => ({
  default: {
    activity: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
  },
}));

import repoResolver from "@/core/repo";
import service from "@/services/notifications";

describe("integration > activity command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls service.activity on parse", async () => {
    const program = new Command();
    program.exitOverride();
    activityCommand.register(program);

    await program.parseAsync(["node", "test", "activity"]);
    expect(repoResolver.resolveRepo).not.toHaveBeenCalled();
    expect(service.activity).toHaveBeenCalledWith(undefined);
  });

  it("passes explicit repo to resolver", async () => {
    const program = new Command();
    program.exitOverride();
    activityCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "activity",
      "--repo",
      "owner/repo",
    ]);

    expect(repoResolver.resolveRepo).toHaveBeenCalledWith("owner/repo");
    expect(service.activity).toHaveBeenCalledWith("owner/repo");
  });
});
