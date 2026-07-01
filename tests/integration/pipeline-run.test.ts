import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import runCommand from "@/commands/pipeline-run";

vi.mock("@/services/run", () => ({
  default: {
    debugRun: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

import runService from "@/services/run";

describe("integration > run commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debug calls service with parsed run id and options", async () => {
    const program = new Command();
    program.exitOverride();
    runCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "pipeline",
      "run",
      "debug",
      "123456",
      "--repo",
      "airscripts/gitfleet",
      "--output-dir",
      "/tmp/run",
    ]);

    expect(runService.debugRun).toHaveBeenCalledWith(123456, {
      outputDir: "/tmp/run",
      repo: "airscripts/gitfleet",
    });
  });
});
