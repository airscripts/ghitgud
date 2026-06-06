import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import leaksCommand from "@/commands/leaks";

vi.mock("@/services/leaks", () => ({
  default: {
    scan: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
    alerts: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
  },
}));

import leaksService from "@/services/leaks";

describe("integration > leaks commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scan calls service.scan with limit", async () => {
    const program = new Command();
    program.exitOverride();
    leaksCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "leaks",
      "scan",
      "--limit",
      "50",
    ]);

    expect(leaksService.scan).toHaveBeenCalledWith({ limit: "50" });
  });

  it("alerts calls service.alerts with filters", async () => {
    const program = new Command();
    program.exitOverride();
    leaksCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "leaks",
      "alerts",
      "--org",
      "airscripts",
      "--state",
      "open",
      "--secret-type",
      "token",
      "--limit",
      "10",
    ]);

    expect(leaksService.alerts).toHaveBeenCalledWith({
      limit: "10",
      state: "open",
      org: "airscripts",
      secretType: "token",
    });
  });
});
