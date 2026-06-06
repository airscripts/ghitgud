import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import pingCommand from "@/commands/ping";

vi.mock("@/services/labels", () => ({
  default: {
    ping: vi.fn(() => Promise.resolve({ success: true, message: "pong" })),
  },
}));

import labelsService from "@/services/labels";

describe("integration > ping command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls labelsService.ping on parse", async () => {
    const program = new Command();
    program.exitOverride();
    pingCommand.register(program);

    await program.parseAsync(["node", "test", "ping"]);
    expect(labelsService.ping).toHaveBeenCalledTimes(1);
  });
});
