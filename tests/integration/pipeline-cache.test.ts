import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import cacheCommand from "@/commands/pipeline-cache";

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
      "pipeline",
      "cache",
      "inspect",
      "linux-node-modules",
      "--repo",
      "airscripts/gitfleet",
    ]);

    expect(cacheService.inspect).toHaveBeenCalledWith(
      "linux-node-modules",
      "airscripts/gitfleet",
    );
  });

  it("download calls service with key and options", async () => {
    const program = new Command();
    program.exitOverride();
    cacheCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "pipeline",
      "cache",
      "download",
      "linux-node-modules",
      "--repo",
      "airscripts/gitfleet",
      "--output-dir",
      "/tmp/cache",
    ]);

    expect(cacheService.download).toHaveBeenCalledWith("linux-node-modules", {
      repo: "airscripts/gitfleet",
      outputDir: "/tmp/cache",
    });
  });
});
