import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import cacheCommand from "@/commands/cache";

vi.mock("@/services/cache", () => ({
  default: {
    inspect: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    download: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

import cacheService from "@/services/cache";

describe("integration > cache commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inspect calls service with key and repo", async () => {
    const program = new Command();
    program.exitOverride();
    cacheCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "cache",
      "inspect",
      "linux-node-modules",
      "--repo",
      "airscripts/ghitgud",
    ]);

    expect(cacheService.inspect).toHaveBeenCalledWith(
      "linux-node-modules",
      "airscripts/ghitgud",
    );
  });

  it("download calls service with key and options", async () => {
    const program = new Command();
    program.exitOverride();
    cacheCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "cache",
      "download",
      "linux-node-modules",
      "--repo",
      "airscripts/ghitgud",
      "--output-dir",
      "/tmp/cache",
    ]);

    expect(cacheService.download).toHaveBeenCalledWith("linux-node-modules", {
      repo: "airscripts/ghitgud",
      outputDir: "/tmp/cache",
    });
  });
});
