import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import profileCommand from "@/commands/profile";

vi.mock("@/services/profile", () => ({
  default: {
    add: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    list: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
    switch: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    detect: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

import profileService from "@/services/profile";

describe("integration > profile commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("add calls service with name and options", async () => {
    const program = new Command();
    program.exitOverride();
    profileCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "profile",
      "add",
      "work",
      "--repo",
      "airscripts/ghitgud",
      "--token",
      "ghp_test",
    ]);

    expect(profileService.add).toHaveBeenCalledWith("work", {
      token: "ghp_test",
      repo: "airscripts/ghitgud",
    });
  });

  it("list calls service", async () => {
    const program = new Command();
    program.exitOverride();
    profileCommand.register(program);

    await program.parseAsync(["node", "test", "profile", "list"]);
    expect(profileService.list).toHaveBeenCalledTimes(1);
  });

  it("switch calls service with profile name", async () => {
    const program = new Command();
    program.exitOverride();
    profileCommand.register(program);

    await program.parseAsync(["node", "test", "profile", "switch", "work"]);
    expect(profileService.switch).toHaveBeenCalledWith("work");
  });

  it("detect calls service", async () => {
    const program = new Command();
    program.exitOverride();
    profileCommand.register(program);

    await program.parseAsync(["node", "test", "profile", "detect"]);
    expect(profileService.detect).toHaveBeenCalledTimes(1);
  });
});
