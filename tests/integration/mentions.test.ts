import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import mentionsCommand from "@/commands/mentions";

vi.mock("@/services/notifications", () => ({
  default: {
    mentions: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
  },
}));

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
    expect(service.mentions).toHaveBeenCalledTimes(1);
  });
});
