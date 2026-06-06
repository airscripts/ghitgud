import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import activityCommand from "@/commands/activity";

vi.mock("@/services/notifications", () => ({
  default: {
    activity: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
  },
}));

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
    expect(service.activity).toHaveBeenCalledTimes(1);
  });
});
